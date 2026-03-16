import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { GEMINI_API_KEY } from '$env/static/private';
import { db } from '$lib/server/db';
import { chats, chatMessages } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { retrieveChunks, type RetrievedChunk } from '$lib/server/rag/retriever';
import type { RequestHandler } from './$types';

const google = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY });

/**
 * Build a system prompt that includes retrieved document context.
 */
function buildSystemPrompt(chunks: RetrievedChunk[]): string {
	if (chunks.length === 0) {
		return 'You are a helpful assistant. Answer the user\'s question to the best of your ability.';
	}

	const contextBlocks = chunks
		.map(
			(c, i) =>
				`[Source ${i + 1}: ${c.filename}, Chunk ${c.chunkIndex + 1}]\n${c.content}`
		)
		.join('\n\n');

	return `You are a helpful, knowledgeable assistant. You can answer any question using your general knowledge.

Additionally, the user has uploaded documents. Some potentially relevant excerpts are shown below.
ONLY use these excerpts if they are clearly relevant to the user's question.
When you use information from the excerpts, cite it using [Source N].
If the excerpts are not relevant, simply ignore them and answer normally using your general knowledge.

--- Document Excerpts ---
${contextBlocks}
--- End Excerpts ---`;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { messages, chatId, parentId } = await request.json();
	const lastMessage = messages[messages.length - 1];

	let activeChatId = chatId;

	// Create a new chat if none provided
	if (!activeChatId) {
		const title =
			lastMessage.content.slice(0, 50) + (lastMessage.content.length > 50 ? '...' : '');
		const [newChat] = await db
			.insert(chats)
			.values({
				userId: session.user.id,
				title
			})
			.returning({ id: chats.id });
		activeChatId = newChat.id;
	}

	// Save user message with parentId for tree structure
	const userMessageId = crypto.randomUUID();
	await db.insert(chatMessages).values({
		id: userMessageId,
		chatId: activeChatId,
		parentId: parentId || null,
		role: 'user',
		content: lastMessage.content
	});

	const assistantMessageId = crypto.randomUUID();

	// --- RAG: Retrieve relevant document chunks ---
	let retrievedChunks: RetrievedChunk[] = [];
	try {
		const candidates = await retrieveChunks(lastMessage.content, session.user.id, 5, 0.05);
		// Only include sources if the best chunk is reasonably relevant (>=0.15)
		const topSimilarity = candidates.length > 0 ? candidates[0].similarity : 0;
		if (topSimilarity >= 0.15) {
			retrievedChunks = candidates.filter((c) => c.similarity >= 0.15);
		}
		console.log(`[RAG] ${candidates.length} candidates, top similarity: ${topSimilarity.toFixed(3)}, ${retrievedChunks.length} included (>=0.15) for user ${session.user.id}`);
	} catch (err) {
		// If retrieval fails (e.g., embed-api down), continue without context
		console.warn('RAG retrieval failed:', err);
	}

	// Build system prompt - only includes document context when relevant chunks exist
	const systemPrompt = buildSystemPrompt(retrievedChunks);

	// Prepare citations metadata
	const citationsData = retrievedChunks.map((c) => ({
		documentId: c.documentId,
		chunkId: c.chunkId,
		filename: c.filename,
		chunkIndex: c.chunkIndex,
		similarity: Math.round(c.similarity * 100) / 100,
		preview: c.content.slice(0, 150)
	}));

	try {
		const result = streamText({
			model: google('gemini-2.5-flash'),
			system: systemPrompt,
			messages,
			maxRetries: 2,
			onFinish: async ({ text }) => {
				if (text) {
					await db.insert(chatMessages).values({
						id: assistantMessageId,
						chatId: activeChatId,
						parentId: userMessageId,
						role: 'assistant',
						content: text,
						citations: citationsData.length > 0 ? JSON.stringify(citationsData) : null
					});
				}
			}
		});

		// Wrap the textStream to catch errors during streaming and convert them
		// into a readable error message instead of silently closing the stream
		const encoder = new TextEncoder();
		const wrappedStream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of result.textStream) {
						controller.enqueue(encoder.encode(chunk));
					}
					controller.close();
				} catch (streamErr: any) {
					const isRateLimit = streamErr?.statusCode === 429 ||
						streamErr?.message?.includes('quota') ||
						streamErr?.message?.includes('429');
					const errorMsg = isRateLimit
						? '\n\n[Error: API rate limit exceeded. Please wait a moment and try again.]'
						: `\n\n[Error: ${streamErr?.message || 'Failed to get AI response. Please try again.'}]`;
					controller.enqueue(encoder.encode(errorMsg));
					controller.close();
				}
			}
		});

		return new Response(wrappedStream, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'X-Chat-Id': activeChatId,
				'X-User-Message-Id': userMessageId,
				'X-Assistant-Message-Id': assistantMessageId,
				'X-Citations': citationsData.length > 0 ? Buffer.from(JSON.stringify(citationsData)).toString('base64') : ''
			}
		});
	} catch (err: any) {
		const message = err?.message || 'AI service error';
		const isRateLimit = err?.statusCode === 429 || message.includes('quota') || message.includes('429');
		const status = isRateLimit ? 429 : 500;
		return new Response(JSON.stringify({ error: isRateLimit ? 'API rate limit exceeded. Please wait a moment and try again.' : message }), {
			status,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

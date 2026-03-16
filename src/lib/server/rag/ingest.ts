import { db } from '$lib/server/db';
import { documents, chunks } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { chunkText } from './chunker';
import { embedTexts } from './embedder';

/**
 * Full ingestion pipeline:
 * 1. Create a document record
 * 2. Chunk the text content
 * 3. Embed all chunks in batches
 * 4. Store chunks + embeddings in pgvector
 */
export async function ingestDocument(
	userId: string,
	filename: string,
	content: string,
	fileType: string = 'text',
	fileSize?: number
) {
	// 1. Create document record
	const [doc] = await db
		.insert(documents)
		.values({
			userId,
			filename,
			fileType,
			fileSize: fileSize ?? content.length
		})
		.returning({ id: documents.id });

	const documentId = doc.id;

	// 2. Chunk the text
	const textChunks = chunkText(content);
	if (textChunks.length === 0) {
		throw new Error('Document produced no chunks — file may be empty');
	}

	// 3. Embed all chunks in batches of 32
	const BATCH_SIZE = 32;
	const allEmbeddings: number[][] = [];

	for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
		const batch = textChunks.slice(i, i + BATCH_SIZE);
		const batchTexts = batch.map((c) => c.content);
		const embeddings = await embedTexts(batchTexts);
		allEmbeddings.push(...embeddings);
	}

	// 4. Store chunks + embeddings in database
	const chunkValues = textChunks.map((chunk, i) => ({
		documentId,
		content: chunk.content,
		chunkIndex: chunk.chunkIndex,
		embedding: allEmbeddings[i]
	}));

	await db.insert(chunks).values(chunkValues);

	// 5. Update document with total chunk count
	await db
		.update(documents)
		.set({ totalChunks: textChunks.length })
		.where(eq(documents.id, documentId));

	return {
		documentId,
		filename,
		totalChunks: textChunks.length
	};
}

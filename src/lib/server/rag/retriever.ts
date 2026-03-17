import { db } from '$lib/server/db';
import { chunks, documents } from '$lib/server/db/schema';
import { sql, eq } from 'drizzle-orm';
import { embedText } from './embedder';

export interface RetrievedChunk {
	chunkId: string;
	documentId: string;
	filename: string;
	content: string;
	chunkIndex: number;
	similarity: number;
}

/**
 * Retrieve the most relevant document chunks for a given query.
 * 1. Embed the query text using the Python service
 * 2. Perform cosine similarity search in pgvector
 * 3. Return top-K results with metadata
 */
export async function retrieveChunks(
	query: string,
	userId: string,
	topK: number = 5,
	minSimilarity: number = 0.05
): Promise<RetrievedChunk[]> {
	// 1. Embed the user's query
	const queryEmbedding = await embedText(query);
	const vectorStr = `[${queryEmbedding.join(',')}]`;

	// 2. Search pgvector for similar chunks (only from user's own documents)
	const results = await db.execute(sql`
		SELECT
			c.id as chunk_id,
			c.document_id,
			d.filename,
			c.content,
			c.chunk_index,
			1 - (c.embedding <=> ${vectorStr}::vector) as similarity
		FROM chunks c
		JOIN documents d ON c.document_id = d.id
		WHERE d.user_id = ${userId}
			AND c.embedding IS NOT NULL
			AND 1 - (c.embedding <=> ${vectorStr}::vector) > ${minSimilarity}
		ORDER BY c.embedding <=> ${vectorStr}::vector
		LIMIT ${topK}
	`);

	console.log('[Retriever] Raw result type:', typeof results, Array.isArray(results), 'length:', (results as any)?.length ?? (results as any)?.rows?.length ?? 'N/A');
	if (!Array.isArray(results) && (results as any)?.rows) {
		console.log('[Retriever] Using results.rows');
	}

	const rows = Array.isArray(results) ? results : (results as any)?.rows ?? [];

	return (rows as any[]).map((row: any) => ({
		chunkId: row.chunk_id,
		documentId: row.document_id,
		filename: row.filename,
		content: row.content,
		chunkIndex: row.chunk_index,
		similarity: parseFloat(row.similarity)
	}));
}

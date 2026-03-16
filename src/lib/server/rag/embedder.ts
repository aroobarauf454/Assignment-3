import { EMBEDDING_API_URL } from '$env/static/private';

interface EmbedResponse {
	embeddings: number[][];
	dimension: number;
	model: string;
}

/**
 * Generate embedding for a single text string.
 * Calls the Python embed-api service.
 */
export async function embedText(text: string): Promise<number[]> {
	const res = await fetch(`${EMBEDDING_API_URL}/embed`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text })
	});

	if (!res.ok) {
		throw new Error(`Embedding service error: ${res.status} ${await res.text()}`);
	}

	const data: EmbedResponse = await res.json();
	return data.embeddings[0];
}

/**
 * Generate embeddings for multiple texts in one batch call.
 * More efficient than calling embedText() in a loop.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
	if (texts.length === 0) return [];

	const res = await fetch(`${EMBEDDING_API_URL}/embed`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ texts })
	});

	if (!res.ok) {
		throw new Error(`Embedding service error: ${res.status} ${await res.text()}`);
	}

	const data: EmbedResponse = await res.json();
	return data.embeddings;
}

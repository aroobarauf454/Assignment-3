export interface TextChunk {
	content: string;
	chunkIndex: number;
}

/**
 * Split text into overlapping chunks.
 * - chunkSize: max characters per chunk (~500)
 * - overlap: characters shared between consecutive chunks (~100)
 * Splits on sentence boundaries when possible.
 */
export function chunkText(
	text: string,
	chunkSize = 500,
	overlap = 100
): TextChunk[] {
	const cleaned = text.replace(/\r\n/g, '\n').trim();
	if (!cleaned) return [];

	// If text is small enough, return as single chunk
	if (cleaned.length <= chunkSize) {
		return [{ content: cleaned, chunkIndex: 0 }];
	}

	const chunks: TextChunk[] = [];
	let start = 0;
	let index = 0;

	while (start < cleaned.length) {
		let end = start + chunkSize;

		if (end < cleaned.length) {
			// Try to break at a sentence boundary (. ! ? \n)
			const slice = cleaned.slice(start, end);
			const lastBreak = Math.max(
				slice.lastIndexOf('. '),
				slice.lastIndexOf('.\n'),
				slice.lastIndexOf('! '),
				slice.lastIndexOf('? '),
				slice.lastIndexOf('\n\n')
			);
			if (lastBreak > chunkSize * 0.3) {
				end = start + lastBreak + 1;
			}
		} else {
			end = cleaned.length;
		}

		const content = cleaned.slice(start, end).trim();
		if (content) {
			chunks.push({ content, chunkIndex: index++ });
		}

		// Move start forward, leaving overlap
		const prevStart = start;
		start = end - overlap;
		// Ensure we always advance — prevents infinite loop when remaining text <= overlap
		if (start <= prevStart) {
			start = end;
		}
	}

	return chunks;
}

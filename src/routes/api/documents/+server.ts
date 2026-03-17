import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents, chunks } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ingestDocument } from '$lib/server/rag/ingest';
import type { RequestHandler } from './$types';

// GET — list all documents for the current user
export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const docs = await db
		.select()
		.from(documents)
		.where(eq(documents.userId, session.user.id))
		.orderBy(desc(documents.createdAt));

	return json(docs);
};

// POST — upload and ingest a new document
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file) {
		return json({ error: 'No file provided' }, { status: 400 });
	}

	// Validate file type
	const allowedTypes = ['.txt', '.md', '.csv', '.json', '.pdf'];
	const ext = '.' + file.name.split('.').pop()?.toLowerCase();
	if (!allowedTypes.includes(ext)) {
		return json(
			{ error: `Unsupported file type: ${ext}. Allowed: ${allowedTypes.join(', ')}` },
			{ status: 400 }
		);
	}

	// Read file content (PDF or text)
	let content: string;
	let fileType: string;

	if (ext === '.pdf') {
		try {
			const { extractText } = await import('unpdf');
			const arrayBuffer = await file.arrayBuffer();
			const result = await extractText(new Uint8Array(arrayBuffer));
			content = Array.isArray(result.text) ? result.text.join('\n') : result.text;
			fileType = 'pdf';
		} catch (err) {
			console.error('PDF parse error:', err);
			return json({ error: 'Failed to parse PDF file' }, { status: 400 });
		}
	} else {
		content = await file.text();
		fileType = 'text';
	}

	if (!content.trim()) {
		return json({ error: 'File is empty or contains no extractable text' }, { status: 400 });
	}

	// Check for duplicate: same filename already uploaded by this user
	const existing = await db
		.select({ id: documents.id })
		.from(documents)
		.where(and(eq(documents.userId, session.user.id), eq(documents.filename, file.name)))
		.limit(1);

	if (existing.length > 0) {
		// Delete old version and re-ingest
		await db.delete(documents).where(eq(documents.id, existing[0].id));
	}

	try {
		const result = await ingestDocument(
			session.user.id,
			file.name,
			content,
			fileType,
			file.size
		);

		return json(result, { status: 201 });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Ingestion failed';
		return json({ error: message }, { status: 500 });
	}
};

// DELETE — remove a document and its chunks
export const DELETE: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { documentId } = await request.json();
	if (!documentId) {
		return json({ error: 'documentId required' }, { status: 400 });
	}

	// Verify ownership
	const [doc] = await db
		.select()
		.from(documents)
		.where(eq(documents.id, documentId));

	if (!doc || doc.userId !== session.user.id) {
		return json({ error: 'Document not found' }, { status: 404 });
	}

	// Cascade delete removes chunks automatically
	await db.delete(documents).where(eq(documents.id, documentId));

	return json({ success: true });
};

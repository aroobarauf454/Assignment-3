import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/sveltekit_auth';
const sql = postgres(DATABASE_URL);

async function migrate() {
	console.log('Running RAG migrations...\n');

	// 1. Enable pgvector extension (must come before any vector column)
	await sql`CREATE EXTENSION IF NOT EXISTS vector`;
	console.log('✓ pgvector extension enabled');

	// 2. Ensure base tables exist (users, chats, etc.) via drizzle-kit push
	//    This script only handles RAG-specific tables that need the vector extension.
	//    Run drizzle-kit push separately for base auth/chat tables.

	// 3. Check if users table exists (needed as foreign key)
	const usersCheck = await sql`
		SELECT EXISTS (
			SELECT FROM information_schema.tables WHERE table_name = 'users'
		) as exists
	`;
	if (!usersCheck[0].exists) {
		console.log('\n⚠ Base tables (users, chats, etc.) not found.');
		console.log('  Run "drizzle-kit push" first, then re-run this migration.');
		await sql.end();
		process.exit(0);
	}

	// 4. Create documents table
	await sql`
		CREATE TABLE IF NOT EXISTS documents (
			id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			filename TEXT NOT NULL,
			file_type TEXT NOT NULL DEFAULT 'text',
			file_size INTEGER,
			total_chunks INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT NOW() NOT NULL
		)
	`;
	console.log('✓ documents table ready');

	// 5. Create chunks table with vector column
	await sql`
		CREATE TABLE IF NOT EXISTS chunks (
			id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
			document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			chunk_index INTEGER NOT NULL,
			metadata TEXT,
			embedding vector(384),
			created_at TIMESTAMP DEFAULT NOW() NOT NULL
		)
	`;
	console.log('✓ chunks table ready');

	// 6. Add citations column to chat_messages if not exists
	await sql`
		ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS citations TEXT
	`;
	console.log('✓ citations column added to chat_messages');

	// 7. Create HNSW index for fast cosine similarity search
	await sql`
		CREATE INDEX IF NOT EXISTS chunks_embedding_idx
		ON chunks USING hnsw (embedding vector_cosine_ops)
	`;
	console.log('✓ HNSW index on chunks.embedding');

	console.log('\n✓ All RAG migrations complete!');
	await sql.end();
}

migrate().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});

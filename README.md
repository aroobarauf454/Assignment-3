# SvelteKit Auth App (AuthKit)

A full-stack authentication application built with SvelteKit (Svelte 5), Auth.js, TailwindCSS, PostgreSQL with pgvector, Drizzle ORM, and an AI Chat interface powered by Google Gemini with RAG (Retrieval-Augmented Generation).

## Features

- Email/password registration and login
- OAuth authentication (Google & GitHub)
- Email verification with secure tokens
- Password reset / forgot password flow
- Protected routes with auth guards
- User profile management
- Dashboard with app statistics
- Admin dashboard with user management, analytics, and controls
- AI Chat interface (Vercel AI SDK + Gemini) with streaming responses
- Tree-structured chat history — fork conversations from any message with branch navigation
- Chat history stored per user in PostgreSQL
- **RAG backend with pgvector** — upload documents, chunk, embed, and retrieve context for AI answers
- **Python embedding microservice** — containerized FastAPI service using sentence-transformers
- **Document ingestion** — supports `.txt`, `.md`, `.csv`, `.json`, and `.pdf` files
- **Citations** — shows which document/chunk informed each AI answer with similarity scores
- **Markdown rendering** with syntax highlighting (highlight.js) in chat messages
- Copy-to-clipboard, regenerate, and edit/fork on any message
- Responsive UI with TailwindCSS
- Database sessions with Drizzle ORM + PostgreSQL
- `/healthz` and `/version` endpoints for production readiness

## Tech Stack

| Component | Technology |
|---|---|
| Frontend Framework | SvelteKit with Svelte 5 |
| Authentication | Auth.js (@auth/sveltekit) |
| Styling | TailwindCSS v4 |
| Database | PostgreSQL 16 with pgvector (Docker) |
| ORM | Drizzle ORM |
| AI | Vercel AI SDK + Google Gemini |
| Embeddings | Python FastAPI + sentence-transformers (all-MiniLM-L6-v2) |
| PDF Parsing | unpdf |
| Markdown | marked + highlight.js |
| Language | TypeScript |

## Prerequisites

- Node.js v18+
- [Docker](https://www.docker.com/products/docker-desktop/) (for PostgreSQL + pgvector and Python embedding service)
- pnpm (`npm install -g pnpm`)

## Quick Start (Fresh-Clone Setup)

```sh
# 1. Clone the repository
git clone https://github.com/aroobarauf454/Assignment-3.git
cd Assignment-3

# 2. Copy environment variables and fill in your secrets
cp .env.example .env
# Set required secrets: DATABASE_URL, GEMINI_API_KEY, EMBEDDING_API_URL, Auth secrets

# 3. Start pgvector DB and embed-api services via Docker
docker-compose up -d

# 4. Install dependencies
pnpm install

# 5. Run database migrations (pushes schema + creates pgvector extension)
pnpm db:migrate

# 6. (Optional) Seed the database
# pnpm db:seed

# 7. Start the development server
pnpm dev
```

Visit `http://localhost:5173` — check `/healthz` and `/version` to verify everything is running.

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (default: `postgresql://postgres:1234@localhost:5432/sveltekit_auth`) |
| `AUTH_SECRET` | Generate with `openssl rand -hex 32` |
| `AUTH_TRUST_HOST` | Set to `true` for local development |
| `AUTH_GOOGLE_ID` | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `AUTH_GOOGLE_SECRET` | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `AUTH_GITHUB_ID` | From [GitHub Developer Settings](https://github.com/settings/developers) |
| `AUTH_GITHUB_SECRET` | From [GitHub Developer Settings](https://github.com/settings/developers) |
| `SMTP_HOST` | SMTP server host (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP server port (e.g., `587`) |
| `SMTP_USER` | SMTP email address |
| `SMTP_PASSWORD` | SMTP app-specific password (quote if it has spaces) |
| `EMAIL_FROM` | Sender email address |
| `ORIGIN` | App URL (default: `http://localhost:5173`) |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/apikey) |
| `EMBEDDING_API_URL` | Python embedding service URL (default: `http://localhost:8000`) |

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm check` | Run svelte-check |
| `pnpm db:start` | Start PostgreSQL Docker container only |
| `pnpm db:stop` | Stop all Docker containers |
| `pnpm db:migrate` | Push Drizzle schema + run pgvector migration |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |

## Project Structure

```
sveltekit-auth-app/
├── embed-api/                      # Python embedding microservice
│   ├── Dockerfile                  # Python 3.11-slim container
│   ├── main.py                     # FastAPI app (all-MiniLM-L6-v2)
│   └── requirements.txt            # Python dependencies
├── docker/
│   └── init/
│       └── 01-extensions.sql       # CREATE EXTENSION vector
├── docker-compose.yml              # pgvector DB + embed-api services
├── src/
│   ├── lib/
│   │   ├── auth.ts                 # Auth.js configuration
│   │   ├── components/
│   │   │   ├── ChatMessage.svelte  # Chat bubble with markdown, syntax highlight, citations
│   │   │   ├── Logo.svelte         # SVG shield logo
│   │   │   ├── Navbar.svelte       # Navigation bar
│   │   │   └── OAuthButtons.svelte # Google & GitHub sign-in buttons
│   │   └── server/
│   │       ├── email.ts            # Email sending (SMTP)
│   │       ├── token.ts            # Secure token generation
│   │       ├── db/
│   │       │   ├── index.ts        # Drizzle client
│   │       │   ├── schema.ts       # Full schema (users, accounts, sessions, chats, documents, chunks)
│   │       │   └── migrate.ts      # pgvector extension migration
│   │       └── rag/
│   │           ├── chunker.ts      # Text chunking (500 chars, 100 overlap)
│   │           ├── embedder.ts     # Calls Python embed-api
│   │           ├── ingest.ts       # Document ingestion pipeline
│   │           └── retriever.ts    # Cosine similarity search in pgvector
│   ├── routes/
│   │   ├── +layout.svelte          # Root layout with Navbar
│   │   ├── +layout.server.ts       # Session loader
│   │   ├── +page.svelte            # Landing page
│   │   ├── login/                  # Login page
│   │   ├── register/               # Registration page
│   │   ├── dashboard/              # Protected dashboard
│   │   ├── profile/                # Protected profile page
│   │   ├── admin/                  # Admin dashboard (role-gated)
│   │   ├── chat/                   # AI Chat with tree history, branch nav, file upload
│   │   ├── documents/              # Document upload & management UI
│   │   ├── healthz/                # Health check endpoint
│   │   ├── version/                # Version endpoint
│   │   ├── api/
│   │   │   ├── chat/               # Gemini streaming + RAG context injection
│   │   │   └── documents/          # Document upload, ingestion, deletion
│   │   └── auth/
│   │       ├── forgot-password/
│   │       ├── reset-password/
│   │       └── verify-email/
│   └── hooks.server.ts             # Auth.js request handler
├── .github/workflows/ci.yml        # CI pipeline
├── drizzle.config.ts               # Drizzle ORM configuration
└── .env.example                    # Environment variable template
```

## Database Schema

Defined in `src/lib/server/db/schema.ts` using Drizzle ORM with pgvector:

| Table | Purpose |
|---|---|
| `users` | User accounts (id, name, email, hashed password, role, disabled status) |
| `accounts` | OAuth provider links (Google, GitHub) tied to users |
| `sessions` | Active session tokens with expiry |
| `verification_tokens` | Tokens for email verification and password reset |
| `chats` | Chat conversations per user (title, timestamps) |
| `chat_messages` | Chat messages in tree structure (role, content, parentId for branching, citations) |
| `documents` | Uploaded documents metadata (filename, type, size, chunk count) |
| `chunks` | Document chunks with `vector(384)` embeddings for pgvector similarity search |

## RAG Architecture

1. **Upload** — User uploads a document (text, markdown, CSV, JSON, or PDF)
2. **Chunk** — Document is split into ~500-character chunks with 100-char overlap
3. **Embed** — Chunks are sent to the Python embedding service (`all-MiniLM-L6-v2`, 384 dimensions)
4. **Store** — Chunks + embeddings stored in pgvector with HNSW index
5. **Query** — User asks a question → query is embedded → cosine similarity search finds relevant chunks
6. **Generate** — Top-K chunks injected into Gemini's system prompt as `[Source N]` context
7. **Cite** — AI response references sources; citations panel shows filename, chunk index, similarity %, and preview

## Troubleshooting

- **Port 5432 already in use**: Stop any existing PostgreSQL service, or run `pnpm db:stop` then `docker-compose up -d`
- **Docker not running**: Make sure Docker Desktop is open before running `docker-compose up -d`
- **Schema push fails**: Ensure the database container is running (`docker ps`) and `DATABASE_URL` in `.env` is correct
- **OAuth not working**: Verify your Google/GitHub OAuth credentials and that redirect URIs are set to `http://localhost:5173/auth/callback/google` and `http://localhost:5173/auth/callback/github`
- **AI Chat not working**: Ensure `GEMINI_API_KEY` is set in your `.env` file
- **Embedding service not starting**: Check `docker logs sveltekit-embed-api` — the model download can take a moment on first run
- **SMTP password with spaces**: Quote it in `.env`: `SMTP_PASSWORD="rgyj ylpz iekw ntnt"`

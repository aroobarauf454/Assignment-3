# SvelteKit Auth App

A full-stack authentication application built with SvelteKit (Svelte 5), Auth.js, TailwindCSS, PostgreSQL, and Drizzle ORM.

## Features

- Email/password registration and login
- OAuth authentication (Google & GitHub)
- Protected routes with auth guards
- User profile management
- Dashboard with app statistics
- Responsive UI with TailwindCSS
- Database sessions with Drizzle ORM + PostgreSQL

## Tech Stack

- **Frontend**: SvelteKit (Svelte 5), TailwindCSS v4
- **Authentication**: Auth.js (@auth/sveltekit)
- **Database**: PostgreSQL 18
- **ORM**: Drizzle ORM
- **Language**: TypeScript

## Prerequisites

- Node.js v18+
- PostgreSQL 18
- npm or pnpm

## Setup

1. **Clone the repository**
   ```sh
   git clone <repo-url>
   cd sveltekit-auth-app
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Create the database**
   ```sh
   psql -U postgres -c "CREATE DATABASE sveltekit_auth"
   ```

4. **Configure environment variables**
   ```sh
   cp .env.example .env
   ```
   Edit `.env` and fill in:
   - `DATABASE_URL` - your PostgreSQL connection string
   - `AUTH_SECRET` - generate with `openssl rand -hex 32`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` - from [GitHub Developer Settings](https://github.com/settings/developers)

5. **Push database schema**
   ```sh
   npx drizzle-kit push
   ```

6. **Start the development server**
   ```sh
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

## Project Structure

```
src/
├── lib/
│   ├── auth.ts                   # Auth.js configuration
│   ├── components/
│   │   ├── Navbar.svelte         # Navigation bar
│   │   └── OAuthButtons.svelte   # Google & GitHub sign-in buttons
│   └── server/
│       └── db/
│           ├── index.ts          # Drizzle client
│           └── schema.ts         # Database schema
├── routes/
│   ├── +layout.svelte            # Root layout with Navbar
│   ├── +layout.server.ts         # Session loader
│   ├── +page.svelte              # Landing page
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── dashboard/                # Protected dashboard
│   └── profile/                  # Protected profile page
├── hooks.server.ts               # Auth.js request handler
├── app.css                       # TailwindCSS entry
└── app.html                      # HTML template
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run svelte-check
- `npx drizzle-kit push` - Push schema changes to database
- `npx drizzle-kit studio` - Open Drizzle Studio (DB GUI)

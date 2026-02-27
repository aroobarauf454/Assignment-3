# SvelteKit Auth App (AuthKit)

A full-stack authentication application built with SvelteKit (Svelte 5), Auth.js, TailwindCSS, PostgreSQL, and Drizzle ORM.

## Features

- Email/password registration and login
- OAuth authentication (Google & GitHub)
- Email verification with secure tokens
- Password reset / forgot password flow
- Protected routes with auth guards
- User profile management
- Dashboard with app statistics
- Animated landing page with branded AuthKit logo
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
   Alternatively, you can apply the raw SQL schema directly:
   ```sh
   psql -U postgres -d sveltekit_auth -f schema.sql
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
│   ├── index.ts                  # Lib barrel export
│   ├── assets/
│   │   └── favicon.svg           # App favicon
│   ├── components/
│   │   ├── Logo.svelte           # Reusable SVG shield logo (AuthKit branding)
│   │   ├── Navbar.svelte         # Navigation bar
│   │   └── OAuthButtons.svelte   # Google & GitHub sign-in buttons
│   └── server/
│       ├── email.ts              # Email sending utility (SMTP)
│       ├── token.ts              # Secure token generation
│       └── db/
│           ├── index.ts          # Drizzle client
│           └── schema.ts         # Database schema
├── routes/
│   ├── +layout.svelte            # Root layout with Navbar
│   ├── +layout.server.ts         # Session loader
│   ├── +page.svelte              # Animated landing page
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── dashboard/                # Protected dashboard
│   ├── profile/                  # Protected profile page
│   └── auth/
│       ├── forgot-password/      # Forgot password page
│       ├── reset-password/       # Reset password page
│       └── verify-email/         # Email verification
│           ├── check-email/      # "Check your email" prompt
│           └── resend/           # Resend verification email
├── hooks.server.ts               # Auth.js request handler
├── app.css                       # TailwindCSS + custom animations
├── app.d.ts                      # TypeScript declarations
└── app.html                      # HTML template

schema.sql                        # Raw SQL schema for assignment submission
drizzle.config.ts                 # Drizzle ORM configuration
```

## Database Schema

The database schema is defined in `src/lib/server/db/schema.ts` using Drizzle ORM and consists of 4 tables:

| Table | Purpose |
|---|---|
| `users` | User accounts (id, name, email, hashed password, email verification status) |
| `accounts` | OAuth provider links (Google, GitHub) tied to users |
| `sessions` | Active session tokens with expiry |
| `verification_tokens` | Tokens for email verification and password reset |

A raw SQL version is available in `schema.sql` at the project root. The schema is applied to PostgreSQL using:
```sh
npx drizzle-kit push
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run svelte-check
- `npx drizzle-kit push` - Push schema changes to database
- `npx drizzle-kit studio` - Open Drizzle Studio (DB GUI)

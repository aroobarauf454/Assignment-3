
import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import GitHub from '@auth/sveltekit/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$lib/server/db';
import { users, accounts, sessions, verificationTokens } from '$lib/server/db/schema';

export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens
	}),
	providers: [
		Google({
			allowDangerousEmailAccountLinking: true,
			authorization: { params: { prompt: 'select_account' } }
		}),
		GitHub({ allowDangerousEmailAccountLinking: true })
	],
	pages: {
		signIn: '/login'
	},
	callbacks: {
		session({ session, user }) {
			if (session.user && user) {
				session.user.id = user.id;
			}
			return session;
		}
	},
	trustHost: true
});

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	if (session) {
		throw redirect(303, '/dashboard');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email, emailNotVerified: false });
		}

		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (!user || !user.hashedPassword) {
			return fail(400, { error: 'Invalid email or password', email, emailNotVerified: false });
		}

		const isValid = await bcrypt.compare(password, user.hashedPassword);
		if (!isValid) {
			return fail(400, { error: 'Invalid email or password', email, emailNotVerified: false });
		}

		// Check email verification
		if (!user.emailVerified) {
			return fail(400, {
				error: 'Please verify your email before signing in.',
				email,
				emailNotVerified: true
			});
		}

		// Create database session
		const sessionToken = crypto.randomUUID();
		const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

		await db.insert(sessions).values({
			sessionToken,
			userId: user.id,
			expires
		});

		cookies.set('authjs.session-token', sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			expires
		});

		throw redirect(303, '/dashboard');
	}
};

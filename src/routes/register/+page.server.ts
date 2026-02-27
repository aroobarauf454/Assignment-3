import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createToken } from '$lib/server/token';
import { sendVerificationEmail } from '$lib/server/email';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	if (session) {
		throw redirect(303, '/dashboard');
	}
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!name || !email || !password) {
			return fail(400, { error: 'All fields are required', name, email });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters', name, email });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', name, email });
		}

		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (existingUser) {
			return fail(400, { error: 'An account with this email already exists', name, email });
		}

		const hashedPassword = await bcrypt.hash(password, 12);

		await db.insert(users).values({
			name,
			email,
			hashedPassword
		});

		// Generate verification token and send email
		const token = await createToken(`verify:${email}`);
		try {
			await sendVerificationEmail(email, token);
		} catch (e) {
			console.error('Failed to send verification email:', e);
		}

		throw redirect(303, `/auth/verify-email/check-email?email=${encodeURIComponent(email)}`);
	}
};

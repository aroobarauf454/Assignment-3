import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createToken } from '$lib/server/token';
import { sendPasswordResetEmail } from '$lib/server/email';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, { error: 'Email is required' });
		}

		// Always show success to prevent email enumeration
		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (user && user.hashedPassword) {
			try {
				const token = await createToken(`reset:${email}`);
				await sendPasswordResetEmail(email, token);
			} catch (e) {
				console.error('Failed to send password reset email:', e);
			}
		}

		return { success: true, email };
	}
};

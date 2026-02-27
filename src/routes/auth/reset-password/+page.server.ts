import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { useToken } from '$lib/server/token';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const email = url.searchParams.get('email');

	if (!token || !email) {
		return { valid: false };
	}

	return { valid: true, token, email };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!token || !email || !password) {
			return fail(400, { error: 'All fields are required', linkInvalid: true, token: '', email: '' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters', linkInvalid: false, token, email });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', linkInvalid: false, token, email });
		}

		const result = await useToken(`reset:${email}`, token);

		if (!result.valid) {
			return fail(400, {
				error: result.expired
					? 'This reset link has expired. Please request a new one.'
					: 'Invalid reset link. Please request a new one.',
				linkInvalid: true,
				token: '',
				email: ''
			});
		}

		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (!user) {
			return fail(400, { error: 'User not found', linkInvalid: true, token: '', email: '' });
		}

		const hashedPassword = await bcrypt.hash(password, 12);

		await db
			.update(users)
			.set({ hashedPassword })
			.where(eq(users.id, user.id));

		throw redirect(303, '/login?passwordReset=true');
	}
};

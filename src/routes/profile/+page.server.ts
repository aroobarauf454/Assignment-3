import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) {
		throw redirect(303, '/login');
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, session.user.id)
	});

	if (!user) {
		throw redirect(303, '/login');
	}

	return {
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image
		}
	};
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const session = await event.locals.auth();
		if (!session?.user?.id) {
			throw redirect(303, '/login');
		}

		const formData = await event.request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name is required' });
		}

		if (!email || email.trim().length === 0) {
			return fail(400, { error: 'Email is required' });
		}

		try {
			await db
				.update(users)
				.set({ name: name.trim(), email: email.trim() })
				.where(eq(users.id, session.user.id));
		} catch (e: any) {
			if (e.message?.includes('unique') || e.code === '23505') {
				return fail(400, { error: 'This email is already in use' });
			}
			return fail(500, { error: 'Failed to update profile' });
		}

		return { success: true };
	},

	changePassword: async (event) => {
		const session = await event.locals.auth();
		if (!session?.user?.id) {
			throw redirect(303, '/login');
		}

		const formData = await event.request.formData();
		const currentPassword = formData.get('currentPassword') as string;
		const newPassword = formData.get('newPassword') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { passwordError: 'All password fields are required' });
		}

		if (newPassword.length < 8) {
			return fail(400, { passwordError: 'New password must be at least 8 characters' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'New passwords do not match' });
		}

		const user = await db.query.users.findFirst({
			where: eq(users.id, session.user.id)
		});

		if (!user?.hashedPassword) {
			return fail(400, { passwordError: 'Password change is not available for this account' });
		}

		const isValid = await bcrypt.compare(currentPassword, user.hashedPassword);
		if (!isValid) {
			return fail(400, { passwordError: 'Current password is incorrect' });
		}

		const hashedPassword = await bcrypt.hash(newPassword, 12);

		await db
			.update(users)
			.set({ hashedPassword })
			.where(eq(users.id, session.user.id));

		return { passwordSuccess: true };
	}
};

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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
	default: async (event) => {
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
	}
};

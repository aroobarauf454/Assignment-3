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

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name is required' });
		}

		await db
			.update(users)
			.set({ name: name.trim() })
			.where(eq(users.id, session.user.id));

		return { success: true };
	}
};

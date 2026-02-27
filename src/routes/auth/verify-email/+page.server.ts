import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { useToken } from '$lib/server/token';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const email = url.searchParams.get('email');

	if (!token || !email) {
		return { status: 'invalid' as const };
	}

	// Check if already verified
	const user = await db.query.users.findFirst({
		where: eq(users.email, email)
	});

	if (!user) {
		return { status: 'invalid' as const };
	}

	if (user.emailVerified) {
		return { status: 'already-verified' as const };
	}

	const result = await useToken(`verify:${email}`, token);

	if (!result.valid) {
		return {
			status: result.expired ? ('expired' as const) : ('invalid' as const),
			email
		};
	}

	// Mark email as verified
	await db
		.update(users)
		.set({ emailVerified: new Date() })
		.where(eq(users.id, user.id));

	return { status: 'success' as const };
};

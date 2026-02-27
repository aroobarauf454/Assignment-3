import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, sessions, accounts } from '$lib/server/db/schema';
import { count } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const [userCount] = await db.select({ count: count() }).from(users);
	const [sessionCount] = await db.select({ count: count() }).from(sessions);
	const [accountCount] = await db.select({ count: count() }).from(accounts);

	return {
		stats: {
			users: userCount.count,
			sessions: sessionCount.count,
			accounts: accountCount.count
		}
	};
};

import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		await db.execute(sql`SELECT 1`);
		return new Response(JSON.stringify({ status: 'ok', db: 'connected' }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		return new Response(JSON.stringify({ status: 'error', db: 'disconnected' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

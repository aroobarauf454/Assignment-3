import { db } from '$lib/server/db';
import { verificationTokens } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function createToken(identifier: string): Promise<string> {
	// Delete any existing tokens for this identifier
	await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));

	const token = crypto.randomUUID();
	const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

	await db.insert(verificationTokens).values({
		identifier,
		token,
		expires
	});

	return token;
}

export async function useToken(
	identifier: string,
	token: string
): Promise<{ valid: boolean; expired?: boolean }> {
	const record = await db.query.verificationTokens.findFirst({
		where: and(
			eq(verificationTokens.identifier, identifier),
			eq(verificationTokens.token, token)
		)
	});

	if (!record) {
		return { valid: false };
	}

	// Delete the token (single-use)
	await db
		.delete(verificationTokens)
		.where(
			and(
				eq(verificationTokens.identifier, identifier),
				eq(verificationTokens.token, token)
			)
		);

	if (record.expires < new Date()) {
		return { valid: false, expired: true };
	}

	return { valid: true };
}

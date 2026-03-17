import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
	return new Response(
		JSON.stringify({
			version: pkg.version,
			name: pkg.name
		}),
		{ headers: { 'Content-Type': 'application/json' } }
	);
};

import type { Session } from '@auth/core/types';

declare module '@auth/core/types' {
	interface Session {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			role?: string;
			disabled?: Date | null;
		};
	}
}

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

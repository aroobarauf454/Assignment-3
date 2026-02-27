<script lang="ts">
	import { signIn, signOut } from '@auth/sveltekit/client';
	import type { Session } from '@auth/core/types';
	import Logo from './Logo.svelte';

	let { session }: { session: Session | null } = $props();
</script>

<nav class="border-b border-gray-200 bg-white shadow-sm">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<div class="flex items-center gap-8">
			<Logo size="sm" />
			{#if session}
				<div class="hidden items-center gap-6 sm:flex">
					<a href="/dashboard" class="text-gray-600 transition hover:text-gray-900">Dashboard</a>
					<a href="/profile" class="text-gray-600 transition hover:text-gray-900">Profile</a>
				</div>
			{/if}
		</div>
		<div class="flex items-center gap-4">
			{#if session}
				<span class="hidden text-sm text-gray-600 sm:inline">
					{session.user?.name || session.user?.email}
				</span>
				{#if session.user?.image}
					<img
						src={session.user.image}
						alt="Avatar"
						class="h-8 w-8 rounded-full"
					/>
				{/if}
				<button
					onclick={() => signOut()}
					class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
				>
					Sign Out
				</button>
			{:else}
				<a
					href="/login"
					class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
				>
					Sign In
				</a>
				<a
					href="/register"
					class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
				>
					Sign Up
				</a>
			{/if}
		</div>
	</div>
</nav>

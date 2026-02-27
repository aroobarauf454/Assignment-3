<script lang="ts">
	import { enhance } from '$app/forms';
	import OAuthButtons from '$lib/components/OAuthButtons.svelte';

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="rounded-xl bg-white p-8 shadow-lg">
			<h2 class="mb-2 text-center text-3xl font-bold text-gray-900">Create an account</h2>
			<p class="mb-8 text-center text-gray-600">Get started with SvelteKit Auth</p>

			{#if form?.error}
				<div class="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
				class="space-y-5"
			>
				<div>
					<label for="name" class="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						value={form?.name ?? ''}
						class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
						placeholder="John Doe"
					/>
				</div>
				<div>
					<label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						value={form?.email ?? ''}
						class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
						placeholder="you@example.com"
					/>
				</div>
				<div>
					<label for="password" class="mb-1 block text-sm font-medium text-gray-700">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						minlength="6"
						class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
						placeholder="At least 6 characters"
					/>
				</div>
				<div>
					<label for="confirmPassword" class="mb-1 block text-sm font-medium text-gray-700">
						Confirm Password
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						required
						minlength="6"
						class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
						placeholder="Repeat your password"
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
				>
					{loading ? 'Creating account...' : 'Create Account'}
				</button>
			</form>

			<div class="my-6 flex items-center gap-4">
				<div class="h-px flex-1 bg-gray-200"></div>
				<span class="text-sm text-gray-500">or continue with</span>
				<div class="h-px flex-1 bg-gray-200"></div>
			</div>

			<OAuthButtons />

			<p class="mt-6 text-center text-sm text-gray-600">
				Already have an account?
				<a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">Sign in</a>
			</p>
		</div>
	</div>
</div>

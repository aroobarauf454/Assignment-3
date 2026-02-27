<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<div class="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="rounded-xl bg-white p-8 shadow-lg">
			<h2 class="mb-2 text-center text-2xl font-bold text-gray-900">Resend Verification Email</h2>
			<p class="mb-6 text-center text-gray-600">
				Enter your email address and we'll send you a new verification link.
			</p>

			{#if form?.success}
				<div class="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-600">
					If an account exists with that email, a verification link has been sent.
				</div>
			{/if}

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
					<label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						value={form?.email ?? data.email ?? ''}
						class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
						placeholder="you@example.com"
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
				>
					{loading ? 'Sending...' : 'Resend Verification Email'}
				</button>
			</form>

			<p class="mt-6 text-center text-sm text-gray-600">
				<a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
					Back to Sign In
				</a>
			</p>
		</div>
	</div>
</div>

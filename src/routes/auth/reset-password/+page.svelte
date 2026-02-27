<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<div class="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="rounded-xl bg-white p-8 shadow-lg">
			{#if !data.valid || form?.linkInvalid}
				<div class="text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
						<svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<h2 class="mb-2 text-2xl font-bold text-gray-900">Invalid Reset Link</h2>
					<p class="mb-6 text-gray-600">
						{form?.error ?? 'This password reset link is invalid or has expired.'}
					</p>
					<a
						href="/auth/forgot-password"
						class="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
					>
						Request New Reset Link
					</a>
				</div>
			{:else}
				<h2 class="mb-2 text-center text-2xl font-bold text-gray-900">Reset Password</h2>
				<p class="mb-6 text-center text-gray-600">Enter your new password below.</p>

				{#if form?.error && !form?.linkInvalid}
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
					<input type="hidden" name="token" value={form?.token ?? data.token} />
					<input type="hidden" name="email" value={form?.email ?? data.email} />
					<div>
						<label for="password" class="mb-1 block text-sm font-medium text-gray-700">
							New Password
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
							Confirm New Password
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
						{loading ? 'Resetting...' : 'Reset Password'}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>

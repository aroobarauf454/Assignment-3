<script lang="ts">
	import { page } from '$app/stores';

	const email = $derived($page.url.searchParams.get('email') ?? '');
</script>

<div class="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="rounded-xl bg-white p-8 shadow-lg text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
				<svg class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
			</div>
			<h2 class="mb-2 text-2xl font-bold text-gray-900">Check your email</h2>
			<p class="mb-2 text-gray-600">
				We've sent a verification link to
			</p>
			{#if email}
				<p class="mb-6 font-medium text-gray-900">{email}</p>
			{/if}
			<p class="mb-6 text-sm text-gray-500">
				Click the link in the email to verify your account. The link expires in 24 hours.
			</p>
			<div class="space-y-3">
				<a
					href="/auth/verify-email/resend?email={encodeURIComponent(email)}"
					class="block rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
				>
					Resend verification email
				</a>
				<a
					href="/login"
					class="block text-sm font-medium text-indigo-600 hover:text-indigo-500"
				>
					Back to Sign In
				</a>
			</div>
		</div>
	</div>
</div>

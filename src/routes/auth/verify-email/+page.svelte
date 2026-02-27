<script lang="ts">
	let { data } = $props();
</script>

<div class="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="rounded-xl bg-white p-8 shadow-lg text-center">
			{#if data.status === 'success'}
				<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
					<svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h2 class="mb-2 text-2xl font-bold text-gray-900">Email Verified!</h2>
				<p class="mb-6 text-gray-600">Your email has been verified successfully. You can now sign in.</p>
				<a
					href="/login"
					class="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
				>
					Sign In
				</a>
			{:else if data.status === 'already-verified'}
				<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
					<svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h2 class="mb-2 text-2xl font-bold text-gray-900">Already Verified</h2>
				<p class="mb-6 text-gray-600">Your email has already been verified.</p>
				<a
					href="/login"
					class="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
				>
					Sign In
				</a>
			{:else if data.status === 'expired'}
				<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
					<svg class="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h2 class="mb-2 text-2xl font-bold text-gray-900">Link Expired</h2>
				<p class="mb-6 text-gray-600">This verification link has expired. Please request a new one.</p>
				<a
					href="/auth/verify-email/resend?email={encodeURIComponent(data.email ?? '')}"
					class="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
				>
					Resend Verification Email
				</a>
			{:else}
				<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
					<svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>
				<h2 class="mb-2 text-2xl font-bold text-gray-900">Invalid Link</h2>
				<p class="mb-6 text-gray-600">This verification link is invalid. Please request a new one.</p>
				<a
					href="/register"
					class="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
				>
					Register Again
				</a>
			{/if}
		</div>
	</div>
</div>

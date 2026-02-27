<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<div class="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
	<h1 class="mb-8 text-3xl font-bold text-gray-900">Profile</h1>

	<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
		<div class="mb-6 flex items-center gap-4">
			{#if data.user.image}
				<img
					src={data.user.image}
					alt="Profile"
					class="h-20 w-20 rounded-full ring-2 ring-indigo-100"
				/>
			{:else}
				<div class="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
					{(data.user.name || data.user.email || '?')[0].toUpperCase()}
				</div>
			{/if}
			<div>
				<p class="text-lg font-medium text-gray-900">{data.user.name || 'No name set'}</p>
				<p class="text-gray-500">{data.user.email}</p>
			</div>
		</div>

		{#if form?.success}
			<div class="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-600">
				Profile updated successfully!
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
				<label for="name" class="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
				<input
					id="name"
					name="name"
					type="text"
					required
					value={data.user.name ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
				/>
			</div>
			<div>
				<label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
				<input
					id="email"
					type="email"
					disabled
					value={data.user.email}
					class="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-500"
				/>
				<p class="mt-1 text-xs text-gray-400">Email cannot be changed</p>
			</div>
			<button
				type="submit"
				disabled={loading}
				class="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
			>
				{loading ? 'Saving...' : 'Save Changes'}
			</button>
		</form>
	</div>
</div>

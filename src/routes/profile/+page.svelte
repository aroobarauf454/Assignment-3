<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let profileLoading = $state(false);
	let passwordLoading = $state(false);
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
			action="?/updateProfile"
			use:enhance={() => {
				profileLoading = true;
				return async ({ update }) => {
					profileLoading = false;
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
					name="email"
					type="email"
					required
					value={data.user.email}
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
				/>
			</div>
			<button
				type="submit"
				disabled={profileLoading}
				class="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
			>
				{profileLoading ? 'Saving...' : 'Save Changes'}
			</button>
		</form>
	</div>

	<div class="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
		<h2 class="mb-5 text-xl font-semibold text-gray-900">Change Password</h2>

		{#if form?.passwordSuccess}
			<div class="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-600">
				Password changed successfully!
			</div>
		{/if}

		{#if form?.passwordError}
			<div class="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
				{form.passwordError}
			</div>
		{/if}

		<form
			method="POST"
			action="?/changePassword"
			use:enhance={() => {
				passwordLoading = true;
				return async ({ update }) => {
					passwordLoading = false;
					await update();
				};
			}}
			class="space-y-5"
		>
			<div>
				<label for="currentPassword" class="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
				<input
					id="currentPassword"
					name="currentPassword"
					type="password"
					required
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
				/>
			</div>
			<div>
				<label for="newPassword" class="mb-1 block text-sm font-medium text-gray-700">New Password</label>
				<input
					id="newPassword"
					name="newPassword"
					type="password"
					required
					minlength={8}
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
				/>
			</div>
			<div>
				<label for="confirmPassword" class="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					required
					minlength={8}
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
				/>
			</div>
			<button
				type="submit"
				disabled={passwordLoading}
				class="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
			>
				{passwordLoading ? 'Changing...' : 'Change Password'}
			</button>
		</form>
	</div>
</div>

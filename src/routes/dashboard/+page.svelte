<script lang="ts">
	let { data } = $props();
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
		<p class="mt-2 text-gray-600">
			Welcome back, <span class="font-medium">{data.session?.user?.name || data.session?.user?.email}</span>
		</p>
	</div>

	<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
		<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
			<p class="text-sm font-medium text-gray-500">Total Users</p>
			<p class="mt-2 text-3xl font-bold text-indigo-600">{data.stats.users}</p>
		</div>
		<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
			<p class="text-sm font-medium text-gray-500">Active Sessions</p>
			<p class="mt-2 text-3xl font-bold text-green-600">{data.stats.sessions}</p>
		</div>
		<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
			<p class="text-sm font-medium text-gray-500">Linked Accounts</p>
			<p class="mt-2 text-3xl font-bold text-purple-600">{data.stats.accounts}</p>
		</div>
	</div>

	<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
		<h2 class="mb-4 text-lg font-semibold text-gray-900">Your Session Info</h2>
		<div class="space-y-3">
			<div class="flex items-center gap-4">
				{#if data.session?.user?.image}
					<img
						src={data.session.user.image}
						alt="Profile"
						class="h-16 w-16 rounded-full ring-2 ring-indigo-100"
					/>
				{:else}
					<div class="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
						{(data.session?.user?.name || data.session?.user?.email || '?')[0].toUpperCase()}
					</div>
				{/if}
				<div>
					<p class="font-medium text-gray-900">{data.session?.user?.name || 'No name set'}</p>
					<p class="text-sm text-gray-500">{data.session?.user?.email}</p>
				</div>
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';

	let { children, data } = $props();
</script>

<svelte:head>
	<title>SvelteKit Auth App</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Navbar session={data.session} />
	<main>
		{@render children()}
	</main>
</div>

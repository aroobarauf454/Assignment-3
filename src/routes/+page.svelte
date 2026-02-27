<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import Logo from '$lib/components/Logo.svelte';

	let { data } = $props();
	let visible = $state(false);

	$effect(() => {
		visible = true;
	});

	const features = [
		{
			title: 'OAuth Providers',
			description: 'Sign in with Google, GitHub, and more with a single click.',
			icon: '🔑',
			color: 'bg-blue-100 text-blue-600',
			hoverColor: 'group-hover:bg-blue-600 group-hover:text-white'
		},
		{
			title: 'Email Verification',
			description: 'Secure account activation with email confirmation links.',
			icon: '✉️',
			color: 'bg-green-100 text-green-600',
			hoverColor: 'group-hover:bg-green-600 group-hover:text-white'
		},
		{
			title: 'Session Management',
			description: 'Persistent sessions with secure cookie-based authentication.',
			icon: '🛡️',
			color: 'bg-purple-100 text-purple-600',
			hoverColor: 'group-hover:bg-purple-600 group-hover:text-white'
		},
		{
			title: 'Password Reset',
			description: 'Self-service password recovery via secure email tokens.',
			icon: '🔄',
			color: 'bg-orange-100 text-orange-600',
			hoverColor: 'group-hover:bg-orange-600 group-hover:text-white'
		}
	];

	const techStack = ['SvelteKit', 'Auth.js', 'PostgreSQL', 'Drizzle ORM', 'Tailwind CSS'];
</script>

<!-- Hero Section -->
{#if visible}
	<section
		class="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-purple-50 px-4 py-20 sm:py-32"
	>
		<!-- Decorative floating circles -->
		<div
			class="animate-float absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-200 opacity-30 blur-3xl"
		></div>
		<div
			class="animate-float-delayed absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-purple-200 opacity-30 blur-3xl"
		></div>

		<div class="relative mx-auto max-w-4xl text-center">
			<!-- Logo -->
			<div in:scale={{ duration: 500, start: 0.5 }} class="mb-8 flex justify-center">
				<Logo size="lg" />
			</div>

			<!-- Heading -->
			<h1
				in:fly={{ y: 30, duration: 600, delay: 200 }}
				class="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl"
			>
				Authentication
				<span
					class="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent"
				>
					Made Simple
				</span>
			</h1>

			<!-- Subtitle -->
			<p
				in:fly={{ y: 20, duration: 600, delay: 400 }}
				class="mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl"
			>
				A full-stack authentication solution built with modern tools. Supports OAuth providers,
				email/password login, session management, and more.
			</p>

			<!-- CTA Buttons -->
			<div
				in:fly={{ y: 20, duration: 600, delay: 600 }}
				class="flex flex-col items-center justify-center gap-4 sm:flex-row"
			>
				{#if data.session}
					<a
						href="/dashboard"
						class="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300"
					>
						Go to Dashboard
						<span
							class="inline-block transition-transform duration-200 group-hover:translate-x-1"
							>→</span
						>
					</a>
				{:else}
					<a
						href="/register"
						class="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300"
					>
						Get Started
						<span
							class="inline-block transition-transform duration-200 group-hover:translate-x-1"
							>→</span
						>
					</a>
					<a
						href="/login"
						class="group inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-lg font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
					>
						Sign In
						<span
							class="inline-block transition-transform duration-200 group-hover:translate-x-1"
							>→</span
						>
					</a>
				{/if}
			</div>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="bg-white px-4 py-20">
		<div class="mx-auto max-w-6xl">
			<h2
				in:fly={{ y: 20, duration: 600, delay: 800 }}
				class="mb-4 text-center text-3xl font-bold text-gray-900"
			>
				Everything You Need
			</h2>
			<p in:fly={{ y: 20, duration: 600, delay: 900 }} class="mb-12 text-center text-gray-600">
				Secure, modern authentication features out of the box.
			</p>

			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each features as feature, i}
					<div
						in:fly={{ y: 30, duration: 500, delay: 1000 + i * 100 }}
						class="group cursor-default rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
					>
						<div
							class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-colors duration-200 {feature.color} {feature.hoverColor}"
						>
							{feature.icon}
						</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
						<p class="text-sm leading-relaxed text-gray-600">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Tech Stack Bar -->
	<section
		in:fade={{ duration: 600, delay: 1200 }}
		class="border-y border-gray-100 bg-gray-50 px-4 py-12"
	>
		<div class="mx-auto max-w-4xl text-center">
			<p class="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-500">Built With</p>
			<div class="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
				{#each techStack as tech}
					<span class="rounded-full bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm">
						{tech}
					</span>
				{/each}
			</div>
		</div>
	</section>

	<!-- Bottom CTA -->
	<section in:fly={{ y: 20, duration: 600, delay: 1400 }} class="bg-white px-4 py-20">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="mb-4 text-3xl font-bold text-gray-900">Ready to Get Started?</h2>
			<p class="mb-8 text-gray-600">
				Create your account in seconds and start building with secure authentication.
			</p>
			{#if !data.session}
				<a
					href="/register"
					class="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300"
				>
					Create Free Account
					<span class="inline-block transition-transform duration-200 group-hover:translate-x-1"
						>→</span
					>
				</a>
			{:else}
				<a
					href="/dashboard"
					class="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300"
				>
					Go to Dashboard
					<span class="inline-block transition-transform duration-200 group-hover:translate-x-1"
						>→</span
					>
				</a>
			{/if}
		</div>
	</section>

	<!-- Footer -->
	<footer in:fade={{ duration: 600, delay: 1400 }} class="border-t border-gray-100 bg-gray-50 px-4 py-10">
		<div class="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
			<Logo size="sm" />
			<nav class="flex gap-6 text-sm text-gray-500">
				<a href="/login" class="transition hover:text-gray-900">Sign In</a>
				<a href="/register" class="transition hover:text-gray-900">Register</a>
				<a href="/dashboard" class="transition hover:text-gray-900">Dashboard</a>
			</nav>
			<p class="text-sm text-gray-400">&copy; {new Date().getFullYear()} AuthKit</p>
		</div>
	</footer>
{/if}

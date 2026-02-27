<script lang="ts">
	let { size = 'sm' }: { size?: 'sm' | 'lg' } = $props();

	const sizes = {
		sm: { icon: 28, text: 'text-xl' },
		lg: { icon: 48, text: 'text-3xl' }
	};

	const s = $derived(sizes[size]);
</script>

<a href="/" class="flex items-center gap-2 no-underline">
	<svg
		width={s.icon}
		height={s.icon}
		viewBox="0 0 64 64"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#818cf8" />
				<stop offset="100%" stop-color="#4338ca" />
			</linearGradient>
		</defs>
		<!-- Shield shape -->
		<path
			d="M32 4L6 16v16c0 14.4 11.1 27.8 26 32 14.9-4.2 26-17.6 26-32V16L32 4z"
			fill="url(#shieldGrad)"
		/>
		<!-- Keyhole circle -->
		<circle cx="32" cy="28" r="7" fill="white" />
		<!-- Keyhole slot -->
		<path d="M28.5 32L32 28l3.5 4v8h-7v-8z" fill="white" />
	</svg>
	<span class="{s.text} font-bold text-indigo-600">AuthKit</span>
</a>

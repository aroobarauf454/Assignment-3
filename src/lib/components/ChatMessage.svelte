<script lang="ts">
	import { marked } from 'marked';
	import hljs from 'highlight.js';

	// Custom renderer for syntax-highlighted code blocks
	const renderer = new marked.Renderer();
	renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
		const language = lang && hljs.getLanguage(lang) ? lang : undefined;
		const highlighted = language
			? hljs.highlight(text, { language }).value
			: hljs.highlightAuto(text).value;
		const langLabel = language || 'text';
		return `<pre><div class="code-header"><span>${langLabel}</span></div><code class="hljs language-${langLabel}">${highlighted}</code></pre>`;
	};
	marked.use({ renderer });

	type Citation = {
		documentId: string;
		chunkId: string;
		filename: string;
		chunkIndex: number;
		similarity: number;
		preview: string;
	};

	let {
		role,
		content,
		citations,
		onEdit,
		onRegenerate,
		siblingCount = 1,
		siblingIndex = 0,
		onBranchChange,
		isStreaming = false,
		timestamp
	}: {
		role: string;
		content: string;
		citations?: Citation[];
		onEdit?: (newContent: string) => void;
		onRegenerate?: () => void;
		siblingCount?: number;
		siblingIndex?: number;
		onBranchChange?: (newIndex: number) => void;
		isStreaming?: boolean;
		timestamp?: Date;
	} = $props();

	let copied = $state(false);
	let editing = $state(false);
	let editText = $state(content);
	let showCitations = $state(false);

	let renderedContent = $derived(
		role !== 'user' ? marked.parse(content, { async: false }) as string : ''
	);

	let formattedTime = $derived(
		timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
	);

	function copyToClipboard() {
		navigator.clipboard.writeText(content);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function startEdit() {
		editText = content;
		editing = true;
	}

	function saveEdit() {
		if (editText.trim() && onEdit) {
			onEdit(editText.trim());
		}
		editing = false;
	}

	function cancelEdit() {
		editing = false;
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css" />
</svelte:head>

<div class="group flex {role === 'user' ? 'justify-end' : 'justify-start'}">
	<div class="relative max-w-[80%]">
		<div
			class="rounded-2xl px-4 py-3 text-sm leading-relaxed {role === 'user'
				? 'bg-indigo-600 text-white'
				: 'bg-gray-100 text-gray-900'}"
		>
			{#if role !== 'user'}
				<p class="mb-1 text-xs font-medium text-indigo-600">Gemini</p>
			{/if}

			{#if editing}
				<textarea
					bind:value={editText}
					onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); } if (e.key === 'Escape') cancelEdit(); }}
					class="w-full resize-none rounded-lg border border-indigo-300 bg-white p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
					rows={Math.min(editText.split('\n').length + 1, 6)}
				></textarea>
				<div class="mt-2 flex gap-2">
					<button onclick={saveEdit} class="rounded-md bg-indigo-700 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-800">
						Save & Resend
					</button>
					<button onclick={cancelEdit} class="rounded-md bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300">
						Cancel
					</button>
				</div>
			{:else if role === 'user'}
				<div class="whitespace-pre-wrap">{content}</div>
			{:else}
				<div class="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-table:my-2 prose-pre:my-2 prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-code:text-indigo-600 prose-code:before:content-[''] prose-code:after:content-['']">
					{@html renderedContent}
					{#if isStreaming}
						<span class="streaming-cursor"></span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Timestamp -->
		{#if formattedTime && !editing}
			<p class="mt-0.5 {role === 'user' ? 'text-right' : 'text-left'} text-[10px] text-gray-400">
				{formattedTime}
			</p>
		{/if}

		<!-- Action buttons -->
		{#if !editing}
			<div class="mt-1 flex {role === 'user' ? 'justify-end' : 'justify-start'} items-center gap-1 opacity-0 transition group-hover:opacity-100">
				{#if citations && citations.length > 0}
					<button
						onclick={() => (showCitations = !showCitations)}
						class="flex items-center gap-1 rounded-md bg-white px-2 py-1.5 text-gray-400 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-gray-600"
						title="View sources"
					>
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<span class="text-[11px] font-medium">{citations.length} sources</span>
					</button>
				{/if}
				<button
					onclick={copyToClipboard}
					class="flex items-center justify-center rounded-md bg-white p-1.5 text-gray-400 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-gray-600"
					title="Copy message"
					aria-label="Copy message"
				>
					{#if copied}
						<svg class="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
						</svg>
					{/if}
				</button>
				{#if role === 'user' && onEdit}
					<button
						onclick={startEdit}
						class="flex items-center justify-center rounded-md bg-white p-1.5 text-gray-400 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-gray-600"
						title="Edit & fork conversation"
						aria-label="Edit & fork conversation"
					>
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
					</button>
				{/if}
				{#if role === 'assistant' && onRegenerate}
					<button
						onclick={onRegenerate}
						class="flex items-center gap-1 rounded-md bg-white px-2 py-1.5 text-gray-400 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-gray-600"
						title="Regenerate response"
					>
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						<span class="text-[11px] font-medium">Regenerate</span>
					</button>
				{/if}
				{#if siblingCount > 1 && onBranchChange}
					<div class="flex items-center gap-1 rounded-md bg-white px-1.5 py-1 shadow-sm ring-1 ring-gray-200">
						<button
							onclick={() => onBranchChange!(siblingIndex - 1)}
							disabled={siblingIndex === 0}
							class="text-gray-400 transition hover:text-gray-600 disabled:opacity-30"
							aria-label="Previous branch"
						>
							<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<span class="min-w-[2rem] text-center text-[11px] font-medium text-gray-500">
							{siblingIndex + 1} / {siblingCount}
						</span>
						<button
							onclick={() => onBranchChange!(siblingIndex + 1)}
							disabled={siblingIndex === siblingCount - 1}
							class="text-gray-400 transition hover:text-gray-600 disabled:opacity-30"
							aria-label="Next branch"
						>
							<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Citations panel -->
		{#if showCitations && citations && citations.length > 0}
			<div class="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
				<p class="mb-2 text-xs font-semibold text-gray-500">Sources used</p>
				<div class="space-y-2">
					{#each citations as citation, i}
						<div class="rounded-md bg-white p-2.5 ring-1 ring-gray-100">
							<div class="flex items-center gap-2">
								<span class="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-[10px] font-bold text-indigo-600">
									{i + 1}
								</span>
								<span class="text-xs font-medium text-gray-700">{citation.filename}</span>
								<span class="text-[10px] text-gray-400">Chunk {citation.chunkIndex + 1}</span>
								<span class="ml-auto text-[10px] text-gray-400">{Math.round(citation.similarity * 100)}% match</span>
							</div>
							<p class="mt-1.5 text-xs leading-relaxed text-gray-500">{citation.preview}...</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.streaming-cursor) {
		display: inline-block;
		width: 2px;
		height: 1em;
		background-color: #4f46e5;
		margin-left: 2px;
		vertical-align: text-bottom;
		animation: blink 0.8s step-end infinite;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	:global(.prose table) {
		display: block;
		overflow-x: auto;
		max-width: 100%;
		font-size: 0.8125rem;
	}

	:global(.prose thead) {
		position: sticky;
		top: 0;
	}

	:global(.prose th),
	:global(.prose td) {
		white-space: nowrap;
		padding: 0.4rem 0.75rem;
	}

	:global(.code-header) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.4rem 0.75rem;
		background: #1e293b;
		border-radius: 0.5rem 0.5rem 0 0;
		font-size: 0.7rem;
		color: #94a3b8;
		font-family: sans-serif;
	}

	:global(pre code.hljs) {
		border-radius: 0 0 0.5rem 0.5rem;
		padding: 1rem;
		font-size: 0.8125rem;
		display: block;
	}
</style>

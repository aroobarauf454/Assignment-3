<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	type Doc = {
		id: string;
		filename: string;
		fileType: string;
		fileSize: number | null;
		totalChunks: number | null;
		createdAt: string;
	};

	let docs: Doc[] = $state([]);
	let uploading = $state(false);
	let error = $state('');
	let success = $state('');
	let dragOver = $state(false);

	// Load documents on mount
	async function loadDocs() {
		const res = await fetch('/api/documents');
		if (res.ok) docs = await res.json();
	}

	$effect(() => {
		loadDocs();
	});

	async function handleUpload(file: File) {
		uploading = true;
		error = '';
		success = '';

		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await fetch('/api/documents', {
				method: 'POST',
				body: formData
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			success = `"${data.filename}" uploaded — ${data.totalChunks} chunks created`;
			await loadDocs();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
		}
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) handleUpload(file);
		input.value = '';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files[0];
		if (file) handleUpload(file);
	}

	async function deleteDoc(id: string) {
		const res = await fetch('/api/documents', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ documentId: id })
		});
		if (res.ok) {
			docs = docs.filter((d) => d.id !== id);
		}
	}

	function formatSize(bytes: number | null) {
		if (!bytes) return '—';
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<div class="min-h-[calc(100vh-4rem)] bg-gray-100 p-4 md:p-6">
	<div class="mx-auto max-w-4xl">
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-gray-900">
				<span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Documents</span>
			</h1>
			<p class="mt-1 text-sm text-gray-500">Upload text files to use as context in AI chat</p>
		</div>

		<!-- Upload Area -->
		<div
			class="mb-6 rounded-2xl border-2 border-dashed bg-white p-8 text-center transition {dragOver
				? 'border-indigo-500 bg-indigo-50'
				: 'border-gray-200 hover:border-gray-300'}"
			ondragover={(e) => { e.preventDefault(); dragOver = true; }}
			ondragleave={() => (dragOver = false)}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
			aria-label="Upload document"
		>
			{#if uploading}
				<div class="flex flex-col items-center gap-3">
					<svg class="h-8 w-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
					<p class="text-sm font-medium text-indigo-600">Processing document...</p>
					<p class="text-xs text-gray-400">Chunking and generating embeddings</p>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-3">
					<div class="rounded-xl bg-indigo-100 p-3">
						<svg class="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-700">Drag & drop a file here, or</p>
						<label class="mt-1 inline-block cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
							Browse files
							<input type="file" accept=".txt,.md,.csv,.json,.pdf" class="hidden" onchange={handleFileInput} />
						</label>
					</div>
					<p class="text-xs text-gray-400">Supports .txt, .md, .csv, .json, .pdf</p>
				</div>
			{/if}
		</div>

		<!-- Messages -->
		{#if error}
			<div in:fly={{ y: -10, duration: 200 }} class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
				{error}
			</div>
		{/if}
		{#if success}
			<div in:fly={{ y: -10, duration: 200 }} class="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
				{success}
			</div>
		{/if}

		<!-- Documents List -->
		<div class="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
			<div class="border-b border-gray-100 px-6 py-4">
				<h2 class="text-sm font-semibold text-gray-700">Uploaded Documents ({docs.length})</h2>
			</div>

			{#if docs.length === 0}
				<div class="px-6 py-12 text-center">
					<p class="text-sm text-gray-400">No documents uploaded yet</p>
				</div>
			{:else}
				<div class="divide-y divide-gray-50">
					{#each docs as doc (doc.id)}
						<div in:fade={{ duration: 200 }} class="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
							<div class="flex items-center gap-4">
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
									<svg class="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<div>
									<p class="text-sm font-medium text-gray-900">{doc.filename}</p>
									<p class="text-xs text-gray-400">
										{formatSize(doc.fileSize)} · {doc.totalChunks ?? 0} chunks · {new Date(doc.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
							<button
								onclick={() => deleteDoc(doc.id)}
								class="rounded-lg p-2 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
								title="Delete document"
								aria-label="Delete {doc.filename}"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

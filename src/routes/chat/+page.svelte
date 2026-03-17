<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import ChatMessage from '$lib/components/ChatMessage.svelte';

	let { data } = $props();

	// Extra chats added client-side (before server re-renders)
	let newChats: Array<{ id: string; title: string; createdAt: Date }> = $state([]);
	let allChats = $derived([...newChats, ...data.chats]);

	type Citation = {
		documentId: string;
		chunkId: string;
		filename: string;
		chunkIndex: number;
		similarity: number;
		preview: string;
	};

	type TreeMessage = {
		id: string;
		parentId: string | null;
		role: string;
		content: string;
		citations?: Citation[];
		timestamp?: Date;
	};

	type PathMessage = TreeMessage & {
		siblingCount: number;
		siblingIndex: number;
	};

	let allMessages: TreeMessage[] = $state([]);
	let chatId: string | null = $state(null);
	let input = $state('');
	let isLoading = $state(false);
	let streamingMessageId: string | null = $state(null);
	let error = $state('');
	let chatContainer: HTMLDivElement | undefined = $state();
	let sidebarOpen = $state(false);
	let selectedBranches: Record<string, number> = $state({});
	let searchQuery = $state('');
	let uploading = $state(false);
	let uploadSuccess = $state('');
	let fileInput: HTMLInputElement | undefined = $state();
	let attachedFiles: Array<{ id: string; filename: string; totalChunks: number; fileSize?: number }> = $state([]);

	let filteredChats = $derived(
		searchQuery.trim()
			? allChats.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
			: allChats
	);

	function buildActivePath(messages: TreeMessage[], branches: Record<string, number>): PathMessage[] {
		if (messages.length === 0) return [];

		const childrenMap = new Map<string, TreeMessage[]>();
		for (const msg of messages) {
			const key = msg.parentId ?? '__root__';
			if (!childrenMap.has(key)) childrenMap.set(key, []);
			childrenMap.get(key)!.push(msg);
		}

		const path: PathMessage[] = [];
		let currentKey = '__root__';

		while (true) {
			const children = childrenMap.get(currentKey);
			if (!children || children.length === 0) break;

			const selectedIdx = branches[currentKey] ?? children.length - 1;
			const clampedIdx = Math.max(0, Math.min(selectedIdx, children.length - 1));
			const selected = children[clampedIdx];
			path.push({
				...selected,
				siblingCount: children.length,
				siblingIndex: clampedIdx
			});

			currentKey = selected.id;
		}

		return path;
	}

	let activePath: PathMessage[] = $derived(buildActivePath(allMessages, selectedBranches));

	// Sync when server data changes (navigation)
	$effect(() => {
		const msgs = data.allMessages;
		allMessages = msgs.map((m: any) => ({
			id: m.id,
			parentId: m.parentId ?? null,
			role: m.role,
			content: m.content,
			citations: m.citations ? (typeof m.citations === 'string' ? JSON.parse(m.citations) : m.citations) : undefined,
			timestamp: m.createdAt ? new Date(m.createdAt) : undefined
		}));
		chatId = data.activeChatId;
		selectedBranches = {};
	});

	function scrollToBottom() {
		if (chatContainer) {
			requestAnimationFrame(() => {
				chatContainer!.scrollTop = chatContainer!.scrollHeight;
			});
		}
	}

	$effect(() => {
		if (activePath.length) scrollToBottom();
	});

	function startNewChat() {
		allMessages = [];
		chatId = null;
		error = '';
		selectedBranches = {};
		attachedFiles = [];
		goto('/chat');
	}

	function switchBranch(parentId: string | null, newIndex: number) {
		const key = parentId ?? '__root__';
		selectedBranches = { ...selectedBranches, [key]: newIndex };
	}

	async function sendToApi(messagesToSend: Array<{ role: string; content: string }>, parentId: string | null) {
		isLoading = true;
		error = '';
		const lastUserMsg = messagesToSend[messagesToSend.length - 1]?.content || '';

		let userMsgId: string | null = null;
		let assistantMsgId: string | null = null;

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: messagesToSend, chatId, parentId })
			});

			if (!response.ok) {
				const errBody = await response.text();
				let errMsg = `Failed to get response (${response.status})`;
				try {
					const parsed = JSON.parse(errBody);
					if (parsed.error) errMsg = parsed.error;
				} catch {}
				if (response.status === 429) errMsg = 'API rate limit exceeded. Please wait a moment and try again.';
				throw new Error(errMsg);
			}

			const newChatId = response.headers.get('X-Chat-Id');
			userMsgId = response.headers.get('X-User-Message-Id');
			assistantMsgId = response.headers.get('X-Assistant-Message-Id');
			const citationsHeader = response.headers.get('X-Citations');
			let citations: Citation[] = [];
			try {
				if (citationsHeader) citations = JSON.parse(atob(citationsHeader));
			} catch {}

			if (newChatId && newChatId !== chatId) {
				chatId = newChatId;
				newChats = [
					{ id: newChatId, title: lastUserMsg.slice(0, 50) + (lastUserMsg.length > 50 ? '...' : ''), createdAt: new Date() },
					...newChats
				];
			}

			const now = new Date();
			// Add messages to local tree
			allMessages = [
				...allMessages,
				{ id: userMsgId!, parentId, role: 'user', content: lastUserMsg, timestamp: now },
				{ id: assistantMsgId!, parentId: userMsgId!, role: 'assistant', content: '', citations, timestamp: now }
			];

			streamingMessageId = assistantMsgId;

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No response body');
			const decoder = new TextDecoder();
			let assistantContent = '';

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					assistantContent += decoder.decode(value, { stream: true });
					allMessages = allMessages.map((m) =>
						m.id === assistantMsgId ? { ...m, content: assistantContent } : m
					);
				}
			} catch (streamErr) {
				console.error('Stream reading error:', streamErr);
			}

			// Handle empty response (e.g. API quota exceeded, stream errored silently)
			if (!assistantContent.trim()) {
				error = 'Failed to get a response from the AI. The API quota may be exceeded — please try again later.';
				allMessages = allMessages.filter((m) => m.id !== assistantMsgId);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
			if (assistantMsgId) {
				allMessages = allMessages.filter((m) => !(m.id === assistantMsgId && !m.content));
			}
		} finally {
			isLoading = false;
			streamingMessageId = null;
		}
	}

	async function handleFork(index: number, newContent: string) {
		const parentId = index > 0 ? activePath[index - 1].id : null;
		const key = parentId ?? '__root__';
		const newBranches = { ...selectedBranches };
		delete newBranches[key];
		selectedBranches = newBranches;

		const messagesToSend = [
			...activePath.slice(0, index).map((m) => ({ role: m.role, content: m.content })),
			{ role: 'user', content: newContent }
		];
		await sendToApi(messagesToSend, parentId);
	}

	async function handleRegenerate() {
		if (isLoading || activePath.length < 2) return;

		// Find the last user message in the path
		const lastAssistantIdx = activePath.length - 1;
		const lastUserIdx = lastAssistantIdx - 1;

		if (activePath[lastAssistantIdx].role !== 'assistant' || activePath[lastUserIdx].role !== 'user') return;

		// Remove the last assistant message from allMessages so regeneration creates a new branch
		const lastAssistantId = activePath[lastAssistantIdx].id;
		allMessages = allMessages.filter((m) => m.id !== lastAssistantId);

		// Get the parent of the user message (to fork from)
		const userMsg = activePath[lastUserIdx];
		const parentId = userMsg.parentId;

		// Rebuild the message history excluding the last pair
		const messagesToSend = activePath.slice(0, lastAssistantIdx + 1).map((m) => ({ role: m.role, content: m.content }));

		// Clear branch at user message's parent so new branch is selected
		const key = parentId ?? '__root__';
		const newBranches = { ...selectedBranches };
		delete newBranches[key];
		// Also clear branch at user message id so the new assistant response is picked
		delete newBranches[userMsg.id];
		selectedBranches = newBranches;

		await sendToApi(messagesToSend, parentId);
	}

	async function handleFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		const fileSize = file.size;
		target.value = '';

		uploading = true;
		uploadSuccess = '';
		error = '';

		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await fetch('/api/documents', { method: 'POST', body: formData });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			attachedFiles = [...attachedFiles, {
				id: data.documentId,
				filename: data.filename,
				totalChunks: data.totalChunks,
				fileSize
			}];
			uploadSuccess = `"${data.filename}" uploaded. The AI can now answer questions about it.`;
			setTimeout(() => (uploadSuccess = ''), 5000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
		}
	}

	function removeAttachedFile(id: string) {
		attachedFiles = attachedFiles.filter((f) => f.id !== id);
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		const userMessage = input.trim();
		input = '';
		attachedFiles = [];
		error = '';

		const parentId = activePath.length > 0 ? activePath[activePath.length - 1].id : null;
		const messagesToSend = [
			...activePath.map((m) => ({ role: m.role, content: m.content })),
			{ role: 'user', content: userMessage }
		];
		await sendToApi(messagesToSend, parentId);
	}
</script>

<div class="h-[calc(100vh-4rem)] bg-gray-100 p-4 md:p-6">
	<div class="mx-auto flex h-full max-w-7xl gap-4">
		<!-- Sidebar -->
		<div class="hidden w-72 flex-shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 md:flex">
			<div class="flex items-center justify-between border-b border-gray-100 p-4">
				<h2 class="text-sm font-semibold text-gray-700">Chat History</h2>
				<button
					onclick={startNewChat}
					class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
				>
					+ New Chat
				</button>
			</div>
			<!-- Search -->
			<div class="border-b border-gray-100 px-3 py-2">
				<div class="relative">
					<svg class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<input
						bind:value={searchQuery}
						placeholder="Search chats..."
						class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
					/>
				</div>
			</div>
			<div class="flex-1 overflow-y-auto p-2">
				{#if filteredChats.length === 0}
					<p class="px-3 py-6 text-center text-xs text-gray-400">
						{searchQuery.trim() ? 'No matching chats' : 'No chats yet'}
					</p>
				{:else}
					{#each filteredChats as chat (chat.id)}
						<div class="group flex items-center gap-1">
							<a
								href="/chat?id={chat.id}"
								class="flex-1 rounded-lg px-3 py-2.5 text-sm transition {chatId === chat.id
									? 'bg-indigo-100 font-medium text-indigo-800'
									: 'text-gray-600 hover:bg-gray-50'}"
							>
								<p class="truncate">{chat.title}</p>
								<p class="mt-0.5 text-[10px] text-gray-400">
									{new Date(chat.createdAt).toLocaleDateString()}
								</p>
							</a>
							<form method="POST" action="?/deleteChat" use:enhance={() => {
								return async ({ update }) => {
									if (chatId === chat.id) startNewChat();
									newChats = newChats.filter(c => c.id !== chat.id);
									update();
								};
							}}>
								<input type="hidden" name="chatId" value={chat.id} />
								<button
									type="submit"
									class="rounded p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
									title="Delete chat"
									aria-label="Delete chat"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</form>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Mobile sidebar toggle -->
		<button
			onclick={() => (sidebarOpen = !sidebarOpen)}
			class="fixed bottom-24 left-4 z-50 rounded-full bg-indigo-600 p-3 text-white shadow-lg md:hidden"
			aria-label="Toggle chat history"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
			</svg>
		</button>

		<!-- Mobile sidebar overlay -->
		{#if sidebarOpen}
			<div class="fixed inset-0 z-40 md:hidden">
				<button
					class="absolute inset-0 bg-black/30"
					onclick={() => (sidebarOpen = false)}
					aria-label="Close sidebar"
				></button>
				<div
					in:fly={{ x: -280, duration: 200 }}
					out:fly={{ x: -280, duration: 200 }}
					class="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-gray-200 bg-white"
				>
					<div class="flex items-center justify-between border-b border-gray-200 p-4">
						<h2 class="text-sm font-semibold text-gray-700">Chat History</h2>
						<button
							onclick={() => { startNewChat(); sidebarOpen = false; }}
							class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
						>
							+ New Chat
						</button>
					</div>
					<div class="flex-1 overflow-y-auto p-2">
						{#each allChats as chat (chat.id)}
							<a
								href="/chat?id={chat.id}"
								onclick={() => (sidebarOpen = false)}
								class="mb-1 block rounded-lg px-3 py-2.5 text-sm transition {chatId === chat.id
									? 'bg-indigo-100 font-medium text-indigo-800'
									: 'text-gray-600 hover:bg-gray-100'}"
							>
								<p class="truncate">{chat.title}</p>
							</a>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Chat area -->
		<div class="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-100 px-6 py-3">
				<div>
					<h1 class="text-lg font-bold text-gray-900">
						<span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AI Chat</span>
					</h1>
					<p class="text-xs text-gray-400">Powered by Gemini</p>
				</div>
				<button
					onclick={startNewChat}
					class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
				>
					+ New Chat
				</button>
			</div>

			<!-- Messages -->
			<div
				bind:this={chatContainer}
				class="flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-8"
				role="log"
				aria-live="polite"
				aria-label="Chat messages"
			>
				{#if activePath.length === 0}
					<div class="flex h-full items-center justify-center">
						<div class="text-center">
							<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
								<svg class="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
								</svg>
							</div>
							<p class="text-lg font-medium text-gray-900">Start a conversation</p>
							<p class="mt-1 text-sm text-gray-500">Ask me anything — I'm powered by Google Gemini.</p>
						</div>
					</div>
				{:else}
					{#each activePath as message, i (message.id)}
						<div in:fly={{ y: 10, duration: 300 }} class="pb-2">
							<ChatMessage
								role={message.role}
								content={message.content}
								citations={message.citations}
								timestamp={message.timestamp}
								isStreaming={message.id === streamingMessageId}
								onEdit={message.role === 'user' && !isLoading ? (newContent) => handleFork(i, newContent) : undefined}
								onRegenerate={message.role === 'assistant' && i === activePath.length - 1 && !isLoading ? handleRegenerate : undefined}
								siblingCount={message.siblingCount}
								siblingIndex={message.siblingIndex}
								onBranchChange={message.siblingCount > 1 ? (newIndex) => switchBranch(message.parentId, newIndex) : undefined}
							/>
						</div>
					{/each}
				{/if}

				{#if isLoading && (activePath.length === 0 || activePath[activePath.length - 1].role !== 'assistant' || !activePath[activePath.length - 1].content)}
					<div in:fade={{ duration: 200 }} class="flex items-center gap-2 text-sm text-gray-400">
						<div class="flex gap-1">
							<span class="h-2 w-2 animate-bounce rounded-full bg-gray-300" style="animation-delay: 0ms"></span>
							<span class="h-2 w-2 animate-bounce rounded-full bg-gray-300" style="animation-delay: 150ms"></span>
							<span class="h-2 w-2 animate-bounce rounded-full bg-gray-300" style="animation-delay: 300ms"></span>
						</div>
						Thinking...
					</div>
				{/if}
			</div>

			<!-- Error -->
			{#if error}
				<div in:fly={{ y: 10, duration: 200 }} class="mx-4 mb-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 md:mx-8">
					{error}
				</div>
			{/if}

			<!-- Upload success -->
			{#if uploadSuccess}
				<div in:fly={{ y: 10, duration: 200 }} class="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700 md:mx-8">
					<svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					{uploadSuccess}
				</div>
			{/if}

			<!-- Input -->
			<div class="border-t border-gray-100 bg-gray-50/50 px-4 py-4 md:px-8">
				<form onsubmit={handleSubmit}>
					<div class="rounded-xl border border-gray-200 bg-white shadow-sm transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
						<!-- Attached files inside input bar -->
						{#if attachedFiles.length > 0}
							<div class="flex flex-wrap gap-2 px-3 pt-3">
								{#each attachedFiles as file (file.id)}
									<div
										in:fly={{ y: 8, duration: 200 }}
										class="flex items-center gap-2.5 rounded-lg bg-gray-100 px-3 py-2"
									>
										<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500 text-white">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										</div>
										<div class="min-w-0">
											<p class="truncate text-sm font-medium text-gray-800">{file.filename}</p>
											<p class="text-[11px] text-gray-400">
												{file.filename.split('.').pop()?.toUpperCase()}{file.fileSize ? ' · ' + formatFileSize(file.fileSize) : ''}
											</p>
										</div>
										<button
											type="button"
											onclick={() => removeAttachedFile(file.id)}
											class="ml-1 flex-shrink-0 rounded-full bg-gray-300 p-0.5 text-white transition hover:bg-gray-400"
											title="Remove"
											aria-label="Remove file"
										>
											<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								{/each}
							</div>
						{/if}
						<!-- Input row -->
						<div class="flex items-center gap-2 px-2 py-2">
							<!-- File upload button -->
							<input
								bind:this={fileInput}
								type="file"
								accept=".txt,.md,.csv,.json,.pdf"
								class="hidden"
								onchange={handleFileUpload}
							/>
							<button
								type="button"
								onclick={() => fileInput?.click()}
								disabled={uploading || isLoading}
								class="flex-shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50"
								title="Upload document for AI context"
								aria-label="Upload document"
							>
								{#if uploading}
									<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
									</svg>
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
									</svg>
								{/if}
							</button>
							<input
								bind:value={input}
								placeholder="Type your message..."
								disabled={isLoading}
								class="flex-1 border-0 bg-transparent px-2 py-1.5 text-sm focus:outline-none disabled:opacity-50"
							/>
							<button
								type="submit"
								disabled={isLoading || !input.trim()}
								class="flex-shrink-0 rounded-lg bg-indigo-600 p-2 text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
							>
						{#if isLoading}
							<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
						{:else}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-4-4l4 4-4 4" />
							</svg>
						{/if}
					</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

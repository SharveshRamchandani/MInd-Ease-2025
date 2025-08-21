import { auth } from './firebase';

const DEFAULT_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const apiBase = DEFAULT_BASE.replace(/\/$/, '');

export type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';

export async function http<T = any>(path: string, options: { method?: HttpMethod; body?: any; headers?: Record<string, string>; timeoutMs?: number } = {}): Promise<T> {
	const { method = 'GET', body, headers = {}, timeoutMs = 10000 } = options;
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeoutMs);
	
	try {
		// Get the current user's ID token for authentication
		let authHeader = '';
		try {
			const currentUser = auth.currentUser;
			if (currentUser) {
				const token = await currentUser.getIdToken();
				authHeader = `Bearer ${token}`;
			}
		} catch (error) {
			console.warn('Failed to get auth token:', error);
		}
		
		const res = await fetch(`${apiBase}${path}`, {
			method,
			headers: {
				'Content-Type': 'application/json',
				...(authHeader ? { 'Authorization': authHeader } : {}),
				...headers,
			},
			body: body ? JSON.stringify(body) : undefined,
			signal: controller.signal,
		});
		clearTimeout(id);
		if (!res.ok) {
			const text = await res.text().catch(() => '');
			throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
		}
		const contentType = res.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			return (await res.json()) as T;
		}
		return (await res.text()) as unknown as T;
	} catch (err: any) {
		clearTimeout(id);
		throw err;
	}
}

export function getCookie(cookie: string, name: string): string | null {
	return (
		cookie
			.split(';')
			.find((c) => c.trim().startsWith(name + '='))
			?.split('=')[1] || null
	);
}

export async function encryptSession(sessionId: string, secret: string): Promise<string> {
	const key = await getKey(secret);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(sessionId));
	const combined = new Uint8Array([...iv, ...new Uint8Array(enc)]);
	return btoa(String.fromCharCode(...combined));
}

export async function decryptSession(encoded: string | null, secret: string): Promise<string | null> {
	if (!encoded) return null;
	try {
		const data = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
		const iv = data.slice(0, 12);
		const enc = data.slice(12);
		const key = await getKey(secret);
		const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, enc);
		return new TextDecoder().decode(dec);
	} catch {
		return null;
	}
}

async function getKey(secret: string): Promise<CryptoKey> {
	const raw = Uint8Array.from(atob(secret), (c) => c.charCodeAt(0));
	return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

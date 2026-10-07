import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL. Check mobile/.env.');
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = `${API_URL}${path}`;
  console.log('[api]', options.method ?? 'GET', url, 'hasToken:', !!session?.access_token);

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...options.headers,
      },
    });
  } catch (networkErr) {
    // This branch fires for things like "adb reverse" not being active,
    // the backend not running, or no network at all — fetch() itself
    // throws before there's any HTTP response to inspect.
    console.error('[api] network error reaching', url, networkErr);
    throw new Error(
      `Could not reach the server at ${API_URL}. Is the backend running and is adb reverse tcp:3000 tcp:3000 active?`,
    );
  }

  if (!res.ok) {
    const body = await res.json().catch((parseErr) => {
      console.error('[api] failed to parse error response body', parseErr);
      return { message: res.statusText };
    });
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    console.error('[api] non-ok response', res.status, message, 'raw body:', body);
    throw new ApiError(res.status, message ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

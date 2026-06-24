import { invoke } from '@tauri-apps/api/core';

export function invokeWithTimeout<T>(cmd: string, args?: Record<string, unknown>, timeoutMs = 60000): Promise<T> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => { timer = null; reject(new Error(`TIMEOUT: ${cmd}`)); }, timeoutMs);
    invoke<T>(cmd, args).then(resolve).catch(reject).finally(() => { if (timer) { clearTimeout(timer); timer = null; } });
  });
}

export interface PinnedResult { status: number; body: string; }
export interface PinnedResponse { ok: boolean; status: number; json: () => Promise<any>; }

function toPinnedResponse(r: PinnedResult): PinnedResponse {
  return {
    ok: r.status >= 200 && r.status < 300,
    status: r.status,
    json: async () => { try { return JSON.parse(r.body); } catch { return {}; } },
  };
}

export async function pinnedGet(path: string, timeoutMs = 30000): Promise<PinnedResponse> {
  const r = await invokeWithTimeout<PinnedResult>('api_get', { path }, timeoutMs);
  return toPinnedResponse(r);
}

export async function pinnedPost(path: string, body: unknown, timeoutMs = 30000): Promise<PinnedResponse> {
  const r = await invokeWithTimeout<PinnedResult>('api_post', { path, body }, timeoutMs);
  return toPinnedResponse(r);
}

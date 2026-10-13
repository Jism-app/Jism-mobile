import { supabase } from './supabase';
import { ScanAngle } from './poseMatching.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL. Check mobile/.env.');
}

// Mirrors ApiError in api.ts — kept as a separate class (not imported)
// so this file has no dependency on api.ts's JSON-only `request()`,
// which can't send multipart/form-data.
export class ScanUploadError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface CapturedAngleImage {
  angle: ScanAngle;
  uri: string; // local file URI from the camera capture (file://...)
}

/**
 * Uploads all 4 captured scan photos as one multipart/form-data request,
 * matching the backend's FileFieldsInterceptor which expects one file
 * per field named 'front' | 'left' | 'right' | 'back' (see
 * backend/src/scans/scans.controller.ts, SCAN_ANGLES).
 *
 * Deliberately does NOT reuse api.ts's `request()` helper — that
 * function always sets `Content-Type: application/json` and
 * JSON.stringifies the body, which is wrong for file uploads. React
 * Native's fetch sets the multipart boundary itself when FormData is
 * passed with no explicit Content-Type, so that header must be left out
 * entirely here.
 */
export async function uploadScan(images: CapturedAngleImage[]): Promise<{ id: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new ScanUploadError(401, 'Not signed in');
  }

  const formData = new FormData();
  for (const { angle, uri } of images) {
    // React Native's FormData expects this { uri, type, name } shape
    // instead of a web File/Blob — it's resolved to multipart file
    // content by the native layer, not by JS.
    formData.append(angle, {
      uri,
      type: 'image/jpeg',
      name: `${angle}.jpg`,
    } as unknown as Blob);
  }

  const url = `${API_URL}/scans`;
  console.log('[scans] POST', url, 'angles:', images.map((i) => i.angle).join(','));

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        // No Content-Type here on purpose — see function doc comment.
      },
      body: formData,
    });
  } catch (networkErr) {
    console.error('[scans] network error reaching', url, networkErr);
    throw new ScanUploadError(
      0,
      `Could not reach the server at ${API_URL}. Is the backend running and is adb reverse tcp:3000 tcp:3000 active?`,
    );
  }

  if (!res.ok) {
    const body = await res.json().catch((parseErr) => {
      console.error('[scans] failed to parse error response body', parseErr);
      return { message: res.statusText };
    });
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    console.error('[scans] non-ok response', res.status, message, 'raw body:', body);
    throw new ScanUploadError(res.status, message ?? 'Scan upload failed');
  }

  return res.json();
}
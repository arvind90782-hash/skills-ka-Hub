const BLOCKED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'instagram.com',
  'pinterest.com',
  'tiktok.com',
  'x.com',
  'twitter.com',
  'snapchat.com',
];

const PRIVATE_HOST_PATTERNS = [/^localhost$/i, /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[0-1])\./];

const json = (res: any, status: number, payload: Record<string, any>) => {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const isPrivateHost = (hostname: string): boolean => {
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
};

const detectExtFromMime = (mime: string): string => {
  if (mime.includes('video/mp4')) return 'mp4';
  if (mime.includes('video/webm')) return 'webm';
  if (mime.includes('audio/mpeg')) return 'mp3';
  if (mime.includes('image/png')) return 'png';
  if (mime.includes('image/jpeg')) return 'jpg';
  if (mime.includes('image/webp')) return 'webp';
  return 'bin';
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const rawUrl = String(body.url || '').trim();
    const quality = String(body.quality || 'best');
    if (!rawUrl) {
      json(res, 400, { ok: false, error: 'Link required' });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      json(res, 400, { ok: false, error: 'Invalid URL format' });
      return;
    }

    if (!['https:', 'http:'].includes(parsed.protocol)) {
      json(res, 400, { ok: false, error: 'Only http/https links allowed' });
      return;
    }

    if (isPrivateHost(parsed.hostname)) {
      json(res, 403, { ok: false, error: 'Private/internal hosts are blocked for security.' });
      return;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
      json(res, 403, {
        ok: false,
        error:
          'This platform is blocked in this tool due to legal/ToS restrictions. Use official app download options or creator-permitted links.',
      });
      return;
    }

    if (quality !== 'best' && !parsed.searchParams.has('quality')) {
      parsed.searchParams.set('quality', quality);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const response = await fetch(parsed.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      json(res, 400, { ok: false, error: `Source request failed (${response.status})` });
      return;
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const contentLength = Number(response.headers.get('content-length') || '0');
    if (contentLength > 80 * 1024 * 1024) {
      json(res, 413, { ok: false, error: 'File too large. Max 80MB allowed.' });
      return;
    }

    if (!contentType.includes('video') && !contentType.includes('image') && !contentType.includes('audio')) {
      json(res, 400, { ok: false, error: 'This link is not a direct media file URL.' });
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const ext = detectExtFromMime(contentType);
    const safeHost = hostname.replace(/[^a-z0-9.-]/gi, '');
    const fileName = `download-${safeHost}-${Date.now()}.${ext}`;

    json(res, 200, {
      ok: true,
      data: {
        base64,
        mimeType: contentType || 'application/octet-stream',
        fileName,
      },
    });
  } catch (error: any) {
    const msg = error?.name === 'AbortError' ? 'Source timeout. Try another link.' : error?.message || 'Download failed';
    json(res, 500, { ok: false, error: msg });
  }
}

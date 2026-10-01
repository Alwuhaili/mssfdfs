import { handleProvisionHttp } from '../../server/provisionHttp.js';

const header = (headers: Record<string, string | undefined> | undefined, name: string): string | undefined => {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
};

export const handler = async (event: {
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
}) => {
  let payload: unknown = {};
  if (event.httpMethod === 'POST' && event.body) {
    try {
      const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }
  const ip = header(event.headers, 'x-nf-client-connection-ip')
    || String(header(event.headers, 'x-forwarded-for') || '').split(',')[0].trim()
    || 'unknown';
  const result = await handleProvisionHttp({
    method: event.httpMethod,
    authorization: header(event.headers, 'authorization'),
    payload,
    ip,
  });
  return {
    statusCode: result.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify(result.body),
  };
};

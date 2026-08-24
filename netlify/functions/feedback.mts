import { getDatabase } from '@netlify/database';
import type { Config } from '@netlify/functions';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FeedbackPayload {
  message?: unknown;
  email?: unknown;
}

export default async (req: Request): Promise<Response> => {
  let payload: FeedbackPayload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: 'Invalid message' }, { status: 400 });
  }
  if (email && (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email))) {
    return Response.json({ error: 'Invalid email' }, { status: 400 });
  }

  const db = getDatabase();
  await db.sql`INSERT INTO feedback (message, email) VALUES (${message}, ${email || null})`;

  return Response.json({ success: true }, { status: 201 });
};

export const config: Config = {
  path: '/api/feedback',
  method: 'POST'
};

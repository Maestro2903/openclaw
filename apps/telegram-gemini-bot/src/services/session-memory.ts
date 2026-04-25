import { env } from "../config/env.js";

export type SessionMessage = {
  role: "user" | "model";
  text: string;
};

type Session = {
  messages: SessionMessage[];
  updatedAt: number;
};

const sessions = new Map<number, Session>();

function pruneExpiredSessions(now: number): void {
  for (const [userId, session] of sessions.entries()) {
    if (now - session.updatedAt > env.SESSION_TTL_MS) {
      sessions.delete(userId);
    }
  }
}

export function getSessionMessages(userId: number): SessionMessage[] {
  const now = Date.now();
  pruneExpiredSessions(now);

  const session = sessions.get(userId);
  if (!session) {
    return [];
  }

  return session.messages;
}

export function appendSessionMessages(userId: number, messages: SessionMessage[]): void {
  const now = Date.now();
  const current = getSessionMessages(userId);
  const nextMessages = [...current, ...messages].slice(-env.SESSION_MAX_MESSAGES);

  sessions.set(userId, {
    messages: nextMessages,
    updatedAt: now
  });
}

export function clearSession(userId: number): void {
  sessions.delete(userId);
}

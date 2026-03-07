/**
 * In-memory session store.
 * Server-side only. Module-level Map persists within the same Node process.
 * Acceptable for a 24-hour hackathon; replace with Redis/DB for production.
 */

import { v4 as uuid } from "uuid";
import type {
  SessionState,
  ActiveMode,
  StoryGenre,
  SceneGraph,
  MusicState,
  StoryModeState,
} from "@/types";
import { defaultProgression } from "./progression";

// ─── Default state helpers ─────────────────────────────────────────────────

function defaultScene(): SceneGraph {
  return {
    sceneType: "unknown",
    objects: [],
    mood: "neutral",
    spatialContext: "Scene not yet analyzed.",
    capturedAt: Date.now(),
  };
}

function defaultMusic(): MusicState {
  return {
    mood: "neutral",
    intensity: 0.3,
    tempo: "slow",
    environment: "unknown",
    isFallback: true,
  };
}

function defaultStoryState(genre: StoryGenre): StoryModeState {
  return {
    genre,
    phase: "scanning",
    characters: [],
    relationships: [],
    activeQuests: [],
    conversationLog: [],
  };
}

// ─── Store ─────────────────────────────────────────────────────────────────

const store = new Map<string, SessionState>();

/** Create a new session and return it. */
export function createSession(
  mode: ActiveMode,
  genre: StoryGenre = "mystery"
): SessionState {
  const id = uuid();
  const session: SessionState = {
    id,
    activeMode: mode,
    sceneGraph: defaultScene(),
    narrativeLog: [],
    musicState: defaultMusic(),
    progression: defaultProgression(),
    startedAt: Date.now(),
    ...(mode === "story" && { storyState: defaultStoryState(genre) }),
    ...(mode === "quest" && {
      questState: {
        missions: [],
        activeMissionId: null,
        completedCampaigns: [],
        momentum: {
          currentCombo: 0,
          sessionProductivityScore: 0,
          lastActivityAt: Date.now(),
          idlePenaltyTriggered: false,
        },
      },
    }),
  };
  store.set(id, session);
  return session;
}

/** Retrieve a session by ID. */
export function getSession(id: string): SessionState | undefined {
  return store.get(id);
}

/** Replace a session (full update). */
export function setSession(session: SessionState): void {
  store.set(session.id, session);
}

/** Shallow-patch a session; returns the updated session or throws if not found. */
export function patchSession(
  id: string,
  patch: Partial<SessionState>
): SessionState {
  const existing = store.get(id);
  if (!existing) throw new Error(`Session not found: ${id}`);
  const updated = { ...existing, ...patch };
  store.set(id, updated);
  return updated;
}

/** Delete a session. */
export function deleteSession(id: string): void {
  store.delete(id);
}

/** List all active sessions (for debugging). */
export function listSessions(): SessionState[] {
  return Array.from(store.values());
}

/** Alias for patchSession — matches the signature expected by music/route.ts */
export const updateSession = patchSession;

/** Backward-compat object API — used by session/route.ts */
export const sessionStore = {
  create: createSession,
  get: getSession,
  update: patchSession,
  set: setSession,
  delete: deleteSession,
  list: listSessions,
} as const;

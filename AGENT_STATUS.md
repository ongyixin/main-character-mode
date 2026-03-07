# AGENT STATUS — Main Character Mode

> Last updated: 2026-03-07  
> Build: ✅ Clean (`npm run build` exits 0, 14 routes, zero TypeScript errors)

---

## Repository Health

| Check | Status |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `next build` | ✅ Exit 0 — all 14 routes compiled |
| ESLint | ⚠️ Not run (not a blocker for hackathon) |
| Tests | ⚠️ None yet |

---

## Module Ownership Map

### Shared Infrastructure (`src/lib/shared/`)

| File | Owner | Status | Notes |
|---|---|---|---|
| `sessions.ts` | Orchestration | ✅ Done | In-memory `Map<string, SessionState>`; exports `createSession`, `getSession`, `patchSession`, `deleteSession` |
| `gemini.ts` | Orchestration | ✅ Done | `generateJSON`, `analyzeImageJSON`, `generateText`; safe variants with `safeGenerateJSON`, `safeAnalyzeImageJSON`, `safeGenerateText`; compat shims for `generateJson`/`generateJsonFromImage` |
| `progression.ts` | Orchestration | ✅ Done | XP/level/streak math; exports `awardXP`, `defaultProgression`, `levelThreshold` |
| `narrator.ts` | Orchestration | ✅ Done | `narrateScene`, `narrateAction`; Gemini-backed with static fallbacks |
| `prompts.ts` | Orchestration | ✅ Done | Centralised prompt templates for all Gemini calls |
| `lyria.ts` | Music Agent | ✅ Done | `startTrack`, `updateMood`, `stopTrack`; static fallback when `LYRIA_API_KEY` absent |
| `nanobanana.ts` | Visual Agent | ✅ Done | `generateVisual`, `generatePoster`; emoji fallback when `NANOBANANA_API_KEY` absent |

### Story Mode (`src/lib/story/`)

| File | Owner | Status | Notes |
|---|---|---|---|
| `personification.ts` | Story Agent | ✅ Done | Object → character conversion via Gemini; `personifyObjects` |
| `relationships.ts` | Story Agent | ✅ Done | Relationship graph; `updateRelationship`, `generateInterObjectRelationships`, `relationshipLabel`, `relationshipColor` |
| `storyEngine.ts` | Story Agent | ✅ Done | State machine: `initStory`, `advanceStory`, `resolveQuest` |
| `escalation.ts` | Story Agent | ✅ Done | Escalation event handler; `checkEscalation`, `resolveEscalation` |

### Quest Mode (`src/lib/quest/`)

| File | Owner | Status | Notes |
|---|---|---|---|
| `contextDetector.ts` | Quest Agent | ✅ Done | Camera scene → context tags; `detectContext` |
| `missionFramer.ts` | Quest Agent | ✅ Done | Context tags → mission brief via Gemini; `frameMission` |
| `momentumTracker.ts` | Quest Agent | ✅ Done | Momentum score management; `updateMomentum`, `getMomentumTier` |
| `taskManager.ts` | Quest Agent | ✅ Done | Task CRUD; `createTask`, `completeTask`, `failTask` |

---

## API Route Ownership

| Route | Owner | Status | Depends On |
|---|---|---|---|
| `POST /api/session` | Orchestration | ✅ Done | `sessions`, `progression` |
| `POST /api/scan` | Scene Agent | ✅ Done | `sessions`, `gemini` (safeAnalyzeImageJSON) |
| `POST /api/talk` | Story/Quest Agent | ✅ Done | `sessions`, `gemini`, `narrator` |
| `POST /api/action` | Story Agent | ✅ Done | `sessions`, `storyEngine` |
| `POST /api/task` | Quest Agent | ✅ Done | `sessions`, `taskManager`, `momentumTracker` |
| `POST /api/progress` | Orchestration | ✅ Done | `sessions`, `progression` |
| `POST /api/music` | Music Agent | ✅ Done | `lyria` |
| `POST /api/poster` | Visual Agent | ✅ Done | `nanobanana` |

All routes are **thin**: validation → session read → lib call → session patch → response. Business logic lives in `src/lib/`.

---

## UI Component Ownership

### Shared (`src/components/shared/`)

| Component | Owner | Status | Notes |
|---|---|---|---|
| `Camera.tsx` | Camera Agent | ✅ Done | `forwardRef`; exposes `CameraHandle` (`startScan`, `stopScan`); accepts `mode`, `scanState`, `onFrame`, `onError` |
| `NarrationBanner.tsx` | UI Agent | ✅ Done | Animated overlay; auto-dismiss; `NarrationEvent` shape |
| `XPBar.tsx` | UI Agent | ✅ Done | Animated XP/level display; accepts `ProgressionState` |
| `ModeSelector.tsx` | UI Agent | ✅ Done | Home screen mode picker |
| `RecapPoster.tsx` | Visual Agent | ✅ Done | Shareable episode summary |
| `MusicIndicator.tsx` | Music Agent | ✅ Done | Floating music state badge |
| `ScanStateIndicator.tsx` | Camera Agent | ✅ Done | Scan state ring overlay |

### Story (`src/components/story/`)

| Component | Owner | Status | Notes |
|---|---|---|---|
| `StoryHUD.tsx` | Story Agent | ✅ Done | Accepts both legacy (`onScan`, `scanLoading`) and new (`scanState`, `onScanRetry`) prop shapes |
| `ObjectLabel.tsx` | Story Agent | ✅ Done | Floating character name tag; accepts both `position` string and `x`/`y` coordinates |
| `InteractionModal.tsx` | Story Agent | ✅ Done | Tap-to-talk; accepts both `onTalk` and `onSend`/`isOpen` |
| `QuestCard.tsx` | Story Agent | ✅ Done | Quest offer card; `StoryQuest \| null` prop |
| `CharacterPortrait.tsx` | Story Agent | ✅ Done | Animated character avatar |
| `RelationshipBar.tsx` | Story Agent | ✅ Done | Relationship score meter |
| `EscalationOverlay.tsx` | Story Agent | ✅ Done | Dramatic escalation flash |
| `MiniGame.tsx` | Story Agent | ✅ Done | Tap mini-game for escalation moments |

### Quest (`src/components/quest/`)

| Component | Owner | Status | Notes |
|---|---|---|---|
| `QuestHUD.tsx` | Quest Agent | ✅ Done | Accepts optional `startedAt`, `scanState`, `onScanRetry`, `onRecap` |
| `MissionBriefing.tsx` | Quest Agent | ✅ Done | Mission card; accepts both `onAccept`/`onSkip` and `onAcceptMission`/`onDefer` |
| `ActiveMission.tsx` | Quest Agent | ✅ Done | Live mission card; optional `momentum`, `latestNarration` |
| `TaskInput.tsx` | Quest Agent | ✅ Done | Free-text task completion |
| `MomentumMeter.tsx` | Quest Agent | ✅ Done | Momentum score display |
| `CampaignRecap.tsx` | Quest Agent | ✅ Done | Campaign summary card |

---

## Pages

| Page | Status | Notes |
|---|---|---|
| `/` (`page.tsx`) | ✅ Done | Mode selector + session init |
| `/story` | ✅ Done | Full Story Mode shell; Suspense-wrapped for `useSearchParams` |
| `/quest` | ✅ Done | Full Quest Mode shell |
| `/recap` | ✅ Done | Shareable recap poster; Suspense-wrapped for `useSearchParams` |

---

## Key Shared Types (`src/types/index.ts`)

All cross-module contracts live here. Do **not** duplicate types in individual modules.

```
SessionState          — top-level session (shared by all modes)
ProgressionState      — XP / level / streak
StoryModeState        — story-specific state
QuestModeState        — quest-specific state
ObjectCharacter       — personified object character
RelationshipEdge      — character ↔ character relationship
SceneObject           — raw detected object from camera
StoryQuest            — quest offer from a character
MissionBrief          — quest mode mission
NarrationEvent        — narrator overlay event
EscalationEvent       — story escalation
MusicState            — current Lyria track state
ActiveMode            — "story" | "quest"
StoryGenre            — "romance" | "mystery" | "thriller" | "comedy" | "drama"
InteractionMode       — "observe" | "talk" | "command" | "gift"
```

Engine interfaces (`ISessionStore`, `IStoryEngine`, `IRelationshipManager`, `IContextDetector`, `IMomentumTracker`, `IMissionFramer`) are defined in types but optional to implement — they serve as documentation contracts.

---

## Environment Variables

Required for full AI features; app runs with mocks/fallbacks if absent:

```bash
GEMINI_API_KEY=          # Scene understanding, dialogue, mission framing
LYRIA_API_KEY=           # Adaptive soundtrack
NANOBANANA_API_KEY=      # Visual asset generation
NANOBANANA_API_URL=      # NanoBanana endpoint (defaults to https://api.nanobanana.ai)
```

Copy `.env.local.example` → `.env.local` and fill in keys.

---

## Known Limitations / Hackathon Scope

- **In-memory session store**: `sessions.ts` uses a `Map`. Restarts clear all sessions. Acceptable for demo.
- **No auth**: Sessions identified by client-generated `sessionId`. Fine for single-device demo.
- **Camera on HTTPS only**: `getUserMedia` requires secure context in production. Use `localhost` or deploy with TLS.
- **Lyria/NanoBanana**: Both have static fallbacks (placeholder music state / emoji) so the demo works without API keys.
- **No persistent storage**: Recap poster image is generated on-demand; not stored.

---

## Next Prompt Templates for Downstream Agents

### Story Agent
```
You are the Story Agent for Main Character Mode. Your scope is:
- src/lib/story/ (personification, relationships, storyEngine, escalation)
- src/components/story/ (all story components)
- src/app/api/action/route.ts, src/app/api/talk/route.ts (story logic)
- src/app/story/page.tsx (replace mock data with live API calls)

Types contract: src/types/index.ts (do not modify without coordinating)
Shared lib: src/lib/shared/ (read-only from your perspective)
Build: npm run build must remain green
```

### Quest Agent
```
You are the Quest Agent for Main Character Mode. Your scope is:
- src/lib/quest/ (contextDetector, missionFramer, momentumTracker, taskManager)
- src/components/quest/ (all quest components)
- src/app/api/task/route.ts (quest task logic)
- src/app/quest/page.tsx (replace mock data with live API calls)

Types contract: src/types/index.ts (do not modify without coordinating)
Shared lib: src/lib/shared/ (read-only from your perspective)
Build: npm run build must remain green
```

### Music Agent
```
You are the Music Agent for Main Character Mode. Your scope is:
- src/lib/shared/lyria.ts (implement real Lyria API calls)
- src/app/api/music/route.ts (wire Lyria to session music state)
- src/components/shared/MusicIndicator.tsx (display music state)

Lyria API key: process.env.LYRIA_API_KEY
Fallback: return static MusicState when key absent (already implemented)
Build: npm run build must remain green
```

### Visual/NanoBanana Agent
```
You are the Visual Agent for Main Character Mode. Your scope is:
- src/lib/shared/nanobanana.ts (implement real NanoBanana API calls)
- src/app/api/poster/route.ts (generate shareable recap poster)
- src/components/shared/RecapPoster.tsx (display poster)

NanoBanana API key: process.env.NANOBANANA_API_KEY
NanoBanana URL: process.env.NANOBANANA_API_URL
Fallback: emoji/placeholder already implemented
Build: npm run build must remain green
```

### Camera/Scene Agent
```
You are the Camera/Scene Agent for Main Character Mode. Your scope is:
- src/components/shared/Camera.tsx (getUserMedia, frame capture)
- src/components/shared/ScanStateIndicator.tsx (scan ring overlay)
- src/app/api/scan/route.ts (base64 → Gemini scene analysis)

Camera component exposes CameraHandle ref with startScan/stopScan.
Pages already integrated — do not change component prop API without coordinating.
Build: npm run build must remain green
```

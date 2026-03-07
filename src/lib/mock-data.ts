/**
 * Deterministic mock data for demo/fallback use.
 * Uses the canonical types from src/types/index.ts.
 * All downstream agents should check for real API responses first.
 */

import type {
  SessionState,
  SceneGraph,
  ObjectCharacter,
  StoryModeState,
  QuestModeState,
  Mission,
  MomentumState,
  MusicState,
  ProgressionState,
  NarrationEvent,
  CampaignRecap,
  DetectedObject,
} from "@/types";

// ─── Scene ─────────────────────────────────────────────────────────────────

export const MOCK_DETECTED_OBJECTS: DetectedObject[] = [
  { id: "lamp-01", label: "desk lamp", salience: 0.85, position: "right", context: "Tilted lamp, dramatic side-lighting" },
  { id: "mug-01", label: "coffee mug", salience: 0.6, position: "center", context: "Half-empty mug with a faded logo" },
  { id: "book-01", label: "stack of books", salience: 0.7, position: "left", context: "Precariously balanced pile" },
];

export const MOCK_SCENE_GRAPH: SceneGraph = {
  sceneType: "cluttered indoor workspace",
  objects: MOCK_DETECTED_OBJECTS,
  mood: "tense and slightly chaotic",
  spatialContext: "A desk with scattered items under warm overhead light",
  capturedAt: Date.now(),
};

// ─── Characters ─────────────────────────────────────────────────────────────

export const MOCK_CHARACTERS: ObjectCharacter[] = [
  {
    id: "lamp-01",
    objectLabel: "desk lamp",
    name: "Lumina",
    personality: "jealous poet",
    voiceStyle: "theatrical",
    emotionalState: "suspicious",
    relationshipToUser: 10,
    relationshipStance: "wary but intrigued",
    memories: ["You moved me three inches to the left. I noticed."],
  },
  {
    id: "mug-01",
    objectLabel: "coffee mug",
    name: "Gordo",
    personality: "weary philosopher",
    voiceStyle: "dry",
    emotionalState: "resigned",
    relationshipToUser: 40,
    relationshipStance: "reluctant ally",
    memories: ["We've been through a lot of mornings together."],
  },
  {
    id: "book-01",
    objectLabel: "stack of books",
    name: "The Stack",
    personality: "unstable collective",
    voiceStyle: "conspiratorial",
    emotionalState: "excited",
    relationshipToUser: -20,
    relationshipStance: "suspicious of your intentions",
    memories: ["We know things. We are many."],
  },
];

// ─── Story Mode State ───────────────────────────────────────────────────────

export const MOCK_STORY_STATE: StoryModeState = {
  genre: "mystery",
  phase: "quest_active",
  characters: MOCK_CHARACTERS,
  relationships: [
    { fromId: "lamp-01", toId: "mug-01", type: "rivalry", intensity: 0.7, reason: "Lumina thinks the mug steals her spotlight" },
  ],
  activeQuests: [
    { id: "q-01", issuedBy: "lamp-01", title: "The Stolen Light", description: "Lumina suspects the mug has been blocking her spotlight.", type: "social", status: "active", xpReward: 80 },
  ],
  conversationLog: [],
};

// ─── Quest Mode State ───────────────────────────────────────────────────────

export const MOCK_MISSIONS: Mission[] = [
  {
    id: "mission-001",
    originalTask: "do laundry",
    codename: "OPERATION: CLEANSING RITUAL",
    briefing: "Textile assets compromised. Neutralize contamination. Clock is running.",
    category: "restoration",
    status: "active",
    xpReward: 150,
    contextTrigger: "laundry room",
    objectives: [
      { id: "obj-01", description: "Load the washing machine", completed: true },
      { id: "obj-02", description: "Add detergent", completed: false },
      { id: "obj-03", description: "Start cycle", completed: false },
    ],
    startedAt: Date.now() - 1000 * 60 * 8,
  },
  {
    id: "mission-002",
    originalTask: "reply to emails",
    codename: "THREAT CONTAINMENT",
    briefing: "Hostile communications detected. Neutralize before end of day.",
    category: "containment",
    status: "briefed",
    xpReward: 90,
    objectives: [
      { id: "obj-04", description: "Open inbox", completed: false },
      { id: "obj-05", description: "Reply to priority messages", completed: false },
    ],
  },
];

export const MOCK_MOMENTUM: MomentumState = {
  currentCombo: 2,
  sessionProductivityScore: 72,
  lastActivityAt: Date.now() - 1000 * 45,
  idlePenaltyTriggered: false,
};

export const MOCK_QUEST_STATE: QuestModeState = {
  missions: MOCK_MISSIONS,
  activeMissionId: "mission-001",
  completedCampaigns: [],
  momentum: MOCK_MOMENTUM,
};

// ─── Progression & Music ────────────────────────────────────────────────────

export const MOCK_PROGRESSION: ProgressionState = {
  xp: 310,
  level: 3,
  currentStreak: 2,
  longestStreak: 5,
  completedToday: 1,
  badges: [],
};

export const MOCK_MUSIC: MusicState = {
  mood: "suspenseful",
  intensity: 0.6,
  tempo: "medium",
  environment: "indoor workspace",
  isFallback: true,
};

// ─── Narration ─────────────────────────────────────────────────────────────

export const MOCK_STORY_NARRATION: NarrationEvent = {
  id: "n-01",
  text: "The lamp has noticed you. It does not look pleased.",
  tone: "dramatic",
  timestamp: Date.now(),
  sourceMode: "story",
};

export const MOCK_QUEST_NARRATION: NarrationEvent = {
  id: "n-02",
  text: "Field agent, your momentum is holding. Do not waste it.",
  tone: "field_dispatch",
  timestamp: Date.now(),
  sourceMode: "quest",
};

// ─── Full Sessions ─────────────────────────────────────────────────────────

export const MOCK_STORY_SESSION: SessionState = {
  id: "story-demo-001",
  activeMode: "story",
  sceneGraph: MOCK_SCENE_GRAPH,
  narrativeLog: [MOCK_STORY_NARRATION],
  musicState: MOCK_MUSIC,
  progression: MOCK_PROGRESSION,
  storyState: MOCK_STORY_STATE,
  startedAt: Date.now() - 1000 * 60 * 5,
};

export const MOCK_QUEST_SESSION: SessionState = {
  id: "quest-demo-001",
  activeMode: "quest",
  sceneGraph: MOCK_SCENE_GRAPH,
  narrativeLog: [MOCK_QUEST_NARRATION],
  musicState: { ...MOCK_MUSIC, mood: "focused" },
  progression: MOCK_PROGRESSION,
  questState: MOCK_QUEST_STATE,
  startedAt: Date.now() - 1000 * 60 * 15,
};

// ─── Campaign Recap ────────────────────────────────────────────────────────

export const MOCK_CAMPAIGN_RECAP: CampaignRecap = {
  date: new Date().toISOString().slice(0, 10),
  missionsCompleted: 3,
  totalXP: 340,
  longestCombo: 4,
  highlightMission: "OPERATION: CLEANSING RITUAL",
};

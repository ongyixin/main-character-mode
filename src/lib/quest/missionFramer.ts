/**
 * Mission Framer — converts plain task text into cinematic missions.
 * Uses Gemini 2.0 Flash for creative framing; deterministic fallbacks
 * ensure the demo works without API access.
 */

import { v4 as uuid } from "uuid";
import { safeGenerateJSON } from "@/lib/shared/gemini";
import { missionFramingPrompt } from "@/lib/shared/prompts";
import type { Mission, MissionCategory, MissionObjective } from "@/types";

// ─── Deterministic fallback library ─────────────────────────────────────────

interface FallbackMission {
  codename: string;
  briefing: string;
  category: MissionCategory;
  objectives: string[];
  xpReward: number;
  contextTrigger?: string;
}

const KEYWORD_MISSIONS: Array<{ keywords: string[]; mission: FallbackMission }> =
  [
    {
      keywords: ["grocer", "grocery", "shop", "supermarket", "store", "food"],
      mission: {
        codename: "Supply Run: Sector 7",
        briefing:
          "Provisions are running low. Acquire the manifest items and extract cleanly. The operation window is narrow.",
        category: "supply_run",
        objectives: [
          "Locate and enter the supply depot",
          "Acquire all items on the manifest",
          "Clear checkout and return to base",
        ],
        xpReward: 100,
        contextTrigger: "grocery store",
      },
    },
    {
      keywords: ["laundry", "wash clothes", "washing"],
      mission: {
        codename: "Operation: Cleansing Ritual",
        briefing:
          "Textile contamination levels critical. Initiate full decontamination sequence. Time-sensitive.",
        category: "restoration",
        objectives: [
          "Sort and load the contaminated textiles",
          "Initiate wash cycle",
          "Transfer to drying protocol",
          "Fold and re-deploy all units",
        ],
        xpReward: 80,
        contextTrigger: "laundry room",
      },
    },
    {
      keywords: ["email", "inbox", "messages", "mail"],
      mission: {
        codename: "Threat Containment: Inbox Zero",
        briefing:
          "Signal backlog at critical density. Clear, process, and neutralise all outstanding communications.",
        category: "containment",
        objectives: [
          "Triage incoming signals by priority",
          "Respond to all critical communications",
          "Archive or eliminate residual noise",
        ],
        xpReward: 90,
        contextTrigger: "office",
      },
    },
    {
      keywords: ["study", "exam", "homework", "read", "chapter", "class"],
      mission: {
        codename: "Knowledge Raid: Chapter Review",
        briefing:
          "Intelligence gap detected. Acquire, process, and internalise target material before the assessment window closes.",
        category: "knowledge_raid",
        objectives: [
          "Establish focus perimeter — phone silenced, distractions neutralised",
          "Complete primary reading of target material",
          "Review and consolidate key intelligence",
        ],
        xpReward: 150,
        contextTrigger: "office",
      },
    },
    {
      keywords: ["clean", "room", "tidy", "organise", "organize", "declutter"],
      mission: {
        codename: "Dungeon Restoration: Base Camp",
        briefing:
          "Forward operating base has fallen below operational standards. Restore order. This is not optional.",
        category: "restoration",
        objectives: [
          "Clear all surface clutter and return items to designated positions",
          "Vacuum or sweep the operational floor area",
          "Assess and restock any supply deficits",
        ],
        xpReward: 100,
        contextTrigger: "bedroom",
      },
    },
    {
      keywords: ["cook", "meal", "prep", "dinner", "lunch", "breakfast", "recipe"],
      mission: {
        codename: "Crafting Sequence: Field Rations",
        briefing:
          "Sustenance levels require attention. Prepare and execute the meal protocol. Improvise as needed.",
        category: "crafting",
        objectives: [
          "Inventory available ingredients and confirm recipe parameters",
          "Execute the preparation sequence",
          "Plate and deliver final product",
        ],
        xpReward: 90,
        contextTrigger: "kitchen",
      },
    },
    {
      keywords: ["run", "exercise", "gym", "workout", "jog", "walk", "hike"],
      mission: {
        codename: "Endurance Protocol: Physical Maintenance",
        briefing:
          "Operational readiness demands physical conditioning. Deploy to the field. Complete or don't come back.",
        category: "endurance",
        objectives: [
          "Gear up and initiate movement",
          "Maintain target pace for designated duration",
          "Complete cooldown and log activity",
        ],
        xpReward: 120,
        contextTrigger: "outdoor",
      },
    },
    {
      keywords: ["meeting", "call", "zoom", "presentation", "report"],
      mission: {
        codename: "Recon Briefing: Contact Established",
        briefing:
          "Inter-agent communication required. Prepare intel and proceed to contact. Do not arrive unprepared.",
        category: "recon",
        objectives: [
          "Prepare talking points and necessary documents",
          "Establish and maintain comms channel",
          "Log outcomes and assign follow-up actions",
        ],
        xpReward: 80,
        contextTrigger: "office",
      },
    },
    {
      keywords: ["dishes", "kitchen", "wash up"],
      mission: {
        codename: "Sanitation Protocol: Kitchen Sector",
        briefing:
          "Kitchen sector shows signs of accumulated biological debris. Cleanse. This was overdue.",
        category: "restoration",
        objectives: [
          "Clear and stack all contaminated vessels",
          "Execute wash-and-dry protocol",
          "Restore kitchen to operational status",
        ],
        xpReward: 60,
        contextTrigger: "kitchen",
      },
    },
  ];

const DEFAULT_FALLBACK: FallbackMission = {
  codename: "Operation: Unspecified",
  briefing:
    "Task parameters received. Execute with standard protocol. The mission clarifies itself in the field.",
  category: "recon",
  objectives: [
    "Assess the situation",
    "Execute primary action sequence",
    "Confirm completion and log outcome",
  ],
  xpReward: 75,
};

function matchFallback(taskText: string): FallbackMission {
  const lower = taskText.toLowerCase();
  for (const { keywords, mission } of KEYWORD_MISSIONS) {
    if (keywords.some((k) => lower.includes(k))) {
      return mission;
    }
  }
  const words = taskText.trim().split(/\s+/).slice(0, 4).join(" ");
  return {
    ...DEFAULT_FALLBACK,
    codename: `Operation: ${words.charAt(0).toUpperCase()}${words.slice(1)}`,
  };
}

function buildObjectives(descriptions: string[]): MissionObjective[] {
  return descriptions.map((desc) => ({
    id: uuid(),
    description: desc,
    completed: false,
  }));
}

// ─── Gemini-powered framing ───────────────────────────────────────────────────

interface GeminiMissionOutput {
  codename: string;
  briefing: string;
  category: MissionCategory;
  objectives: Array<{ id?: string; description: string; completed?: boolean }>;
  xpReward: number;
  contextTrigger?: string | null;
}

async function frameMission(
  taskText: string,
  sceneContext = "",
  recentMissions: string[] = []
): Promise<Mission> {
  const timeHint = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    hour12: true,
  }).format(new Date());

  const output = await safeGenerateJSON<GeminiMissionOutput>(
    missionFramingPrompt(taskText, sceneContext, timeHint, recentMissions)
  );

  if (output) {
    return {
      id: uuid(),
      originalTask: taskText,
      codename: output.codename,
      briefing: output.briefing,
      category: output.category,
      status: "briefed",
      xpReward: Math.max(50, Math.min(300, output.xpReward)),
      contextTrigger: output.contextTrigger ?? undefined,
      objectives: buildObjectives(
        output.objectives.map((o) => o.description)
      ),
      startedAt: undefined,
      completedAt: undefined,
    };
  }

  const fb = matchFallback(taskText);
  return {
    id: uuid(),
    originalTask: taskText,
    codename: fb.codename,
    briefing: fb.briefing,
    category: fb.category,
    status: "briefed",
    xpReward: fb.xpReward,
    contextTrigger: fb.contextTrigger,
    objectives: buildObjectives(fb.objectives),
    startedAt: undefined,
    completedAt: undefined,
  };
}

/**
 * IMissionFramer-compatible object export.
 * `userHistory` is a string of recent task/mission names (comma-separated or prose).
 */
export const missionFramer = {
  async frame(
    taskText: string,
    sceneContext: string,
    userHistory: string
  ): Promise<Mission> {
    // Convert comma-separated history string to array for the prompt
    const recentArr = userHistory
      ? userHistory.split(/,\s*/).filter(Boolean)
      : [];
    return frameMission(taskText, sceneContext, recentArr);
  },
};

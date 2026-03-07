/**
 * Context detector for Quest Mode.
 * Matches the current scene graph against pending missions to find
 * environmental activation triggers and relevant context cues.
 * Stub owned by Shared Engine agent; Quest Mode agent should extend with
 * richer scoring, time-based hints, and location awareness.
 */

import type { SceneGraph, Mission, IContextDetector } from "@/types";

// ─── Scene-to-task keyword mapping ───────────────────────────────────────────

const SCENE_TYPE_TASKS: Record<string, string[]> = {
  "kitchen":        ["cooking", "crafting", "restoration", "supply_run"],
  "grocery store":  ["supply_run"],
  "supermarket":    ["supply_run"],
  "laundry room":   ["restoration"],
  "bedroom":        ["restoration", "endurance"],
  "desk":           ["knowledge_raid", "containment", "recon"],
  "office":         ["knowledge_raid", "containment", "recon"],
  "gym":            ["endurance"],
  "bathroom":       ["restoration"],
  "living room":    ["recon", "endurance"],
};

const OBJECT_TASK_HINTS: Record<string, string[]> = {
  laptop:    ["knowledge_raid", "containment"],
  computer:  ["knowledge_raid", "containment"],
  book:      ["knowledge_raid"],
  notebook:  ["knowledge_raid"],
  fridge:    ["supply_run", "crafting"],
  stove:     ["crafting"],
  pan:       ["crafting"],
  washer:    ["restoration"],
  dryer:     ["restoration"],
  weights:   ["endurance"],
  yoga:      ["endurance"],
};

// ─── Implementation ───────────────────────────────────────────────────────────

export const contextDetector: IContextDetector = {
  match(
    sceneGraph: SceneGraph,
    missions: Mission[]
  ): { activations: string[]; matches: string[] } {
    const sceneTypeLower = sceneGraph.sceneType.toLowerCase();

    // Gather task categories relevant to this scene
    const relevantCategories = new Set<string>();

    // From scene type
    for (const [sceneKey, categories] of Object.entries(SCENE_TYPE_TASKS)) {
      if (sceneTypeLower.includes(sceneKey)) {
        categories.forEach((c) => relevantCategories.add(c));
      }
    }

    // From detected objects
    for (const obj of sceneGraph.objects) {
      const labelLower = obj.label.toLowerCase();
      for (const [objKey, categories] of Object.entries(OBJECT_TASK_HINTS)) {
        if (labelLower.includes(objKey)) {
          categories.forEach((c) => relevantCategories.add(c));
        }
      }
    }

    // Find missions whose contextTrigger matches the scene type
    const activations: string[] = [];
    const matches: string[] = [];

    for (const mission of missions) {
      if (mission.status !== "briefed") continue;

      // Direct contextTrigger match
      const trigger = mission.contextTrigger?.toLowerCase() ?? "";
      if (trigger && sceneTypeLower.includes(trigger)) {
        activations.push(mission.id);
        continue;
      }

      // Category-based relevance
      if (relevantCategories.has(mission.category)) {
        matches.push(mission.id);
      }
    }

    return { activations, matches };
  },
};

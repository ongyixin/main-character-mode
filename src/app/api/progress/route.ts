/**
 * POST /api/progress
 * Reports a progress signal for a quest mission.
 * Handles: objective_complete, mission_complete, mission_abandon,
 *          context_detected, idle_detected
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession, patchSession } from "@/lib/shared/sessions";
import { taskManager } from "@/lib/quest/taskManager";
import { momentumTracker } from "@/lib/quest/momentumTracker";
import { progression as prog } from "@/lib/shared/progression";
import { generateQuestNarration } from "@/lib/shared/narrator";
import type {
  ProgressRequest,
  QuestModeState,
  NarrationEvent,
  MusicState,
  ProgressionState,
} from "@/types";

function comboMultiplier(combo: number): number {
  if (combo <= 1) return 1;
  if (combo <= 3) return 1.25;
  if (combo <= 6) return 1.5;
  return 2;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProgressRequest;

    if (!body.sessionId || !body.missionId || !body.signal) {
      return NextResponse.json(
        { error: "sessionId, missionId, and signal are required" },
        { status: 400 }
      );
    }

    const session = getSession(body.sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.activeMode !== "quest" || !session.questState) {
      return NextResponse.json(
        { error: "Session is not in quest mode" },
        { status: 400 }
      );
    }

    let questState: QuestModeState = session.questState;
    let progressionState: ProgressionState = session.progression;
    let xpEarned = 0;
    let narration: NarrationEvent | undefined;

    const mission = taskManager.getMission(questState, body.missionId);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const missionCodename = mission.codename;
    const combo = questState.momentum.currentCombo;
    const score = questState.momentum.sessionProductivityScore;

    switch (body.signal) {
      case "objective_complete": {
        if (!body.objectiveId) {
          return NextResponse.json(
            { error: "objectiveId required for objective_complete signal" },
            { status: 400 }
          );
        }
        // taskManager.completeObjective also auto-completes mission when all done
        questState = taskManager.completeObjective(
          questState,
          body.missionId,
          body.objectiveId
        );
        questState = {
          ...questState,
          momentum: momentumTracker.recordObjectiveComplete(questState.momentum),
        };

        const objXP = Math.round(
          (mission.xpReward / Math.max(mission.objectives.length, 1)) *
            comboMultiplier(combo + 1)
        );
        xpEarned = objXP;
        progressionState = prog.awardXP(progressionState, objXP);

        narration = await generateQuestNarration(
          "objective_complete",
          missionCodename,
          combo + 1,
          score
        );

        // If auto-completed, add full mission bonus and update streak
        const afterMission = taskManager.getMission(questState, body.missionId);
        if (afterMission?.status === "completed") {
          questState = {
            ...questState,
            activeMissionId:
              questState.activeMissionId === body.missionId
                ? null
                : questState.activeMissionId,
            momentum: momentumTracker.recordMissionComplete(questState.momentum),
          };
          const bonusXP = Math.round(
            mission.xpReward * 0.2 * comboMultiplier(combo + 1)
          );
          xpEarned += bonusXP;
          progressionState = prog.awardXP(progressionState, bonusXP);
          progressionState = prog.updateStreak(progressionState);
          narration = await generateQuestNarration(
            "mission_complete",
            missionCodename,
            combo + 1,
            score
          );
        }
        break;
      }

      case "mission_complete": {
        questState = taskManager.setMissionStatus(
          questState,
          body.missionId,
          "completed"
        );
        questState = {
          ...questState,
          momentum: momentumTracker.recordMissionComplete(questState.momentum),
        };
        xpEarned = Math.round(mission.xpReward * comboMultiplier(combo));
        progressionState = prog.awardXP(progressionState, xpEarned);
        progressionState = prog.updateStreak(progressionState);
        narration = await generateQuestNarration(
          "mission_complete",
          missionCodename,
          combo,
          score
        );
        break;
      }

      case "mission_abandon": {
        questState = taskManager.setMissionStatus(
          questState,
          body.missionId,
          "abandoned"
        );
        questState = {
          ...questState,
          momentum: momentumTracker.breakCombo(questState.momentum),
        };
        narration = await generateQuestNarration(
          "mission_abandon",
          missionCodename,
          0,
          score
        );
        break;
      }

      case "context_detected": {
        if (mission.status === "briefed") {
          questState = taskManager.setMissionStatus(
            questState,
            body.missionId,
            "active"
          );
        }
        questState = {
          ...questState,
          momentum: momentumTracker.recordActivity(questState.momentum),
        };
        narration = await generateQuestNarration(
          "context_detected",
          missionCodename,
          combo,
          score
        );
        break;
      }

      case "idle_detected": {
        questState = {
          ...questState,
          momentum: momentumTracker.applyIdlePenalty(questState.momentum),
        };
        narration = await generateQuestNarration(
          "idle_detected",
          missionCodename,
          0,
          score
        );
        break;
      }
    }

    patchSession(body.sessionId, {
      questState,
      progression: progressionState,
    });

    const newScore = questState.momentum.sessionProductivityScore;
    const musicUpdate: Partial<MusicState> = {
      intensity: Math.max(0.2, newScore / 100),
      tempo: newScore > 70 ? "fast" : newScore > 40 ? "medium" : "slow",
      mood: newScore > 70 ? "driving" : newScore > 40 ? "focused" : "ambient",
    };

    return NextResponse.json({
      update: questState,
      narration,
      xpEarned,
      combo: questState.momentum.currentCombo,
      musicUpdate,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

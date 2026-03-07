// Task Manager — Quest Mode
// CRUD operations on the missions list within a session.
// OWNER: Quest Mode Agent

import type { QuestModeState, Mission, MissionStatus } from "@/types";

export const taskManager = {
  addMission(state: QuestModeState, mission: Mission): QuestModeState {
    return { ...state, missions: [...state.missions, mission] };
  },

  setMissionStatus(
    state: QuestModeState,
    missionId: string,
    status: MissionStatus
  ): QuestModeState {
    const missions = state.missions.map((m) => {
      if (m.id !== missionId) return m;
      const updates: Partial<Mission> = { status };
      if (status === "active" && !m.startedAt) updates.startedAt = Date.now();
      if (status === "completed") updates.completedAt = Date.now();
      return { ...m, ...updates };
    });

    const activeMissionId =
      status === "active"
        ? missionId
        : state.activeMissionId === missionId
        ? null
        : state.activeMissionId;

    return { ...state, missions, activeMissionId };
  },

  completeObjective(
    state: QuestModeState,
    missionId: string,
    objectiveId: string
  ): QuestModeState {
    const missions = state.missions.map((m) => {
      if (m.id !== missionId) return m;
      const objectives = m.objectives.map((o) =>
        o.id === objectiveId ? { ...o, completed: true } : o
      );
      // Auto-complete mission when all objectives done
      const allDone = objectives.every((o) => o.completed);
      return {
        ...m,
        objectives,
        status: allDone ? ("completed" as MissionStatus) : m.status,
        completedAt: allDone ? Date.now() : m.completedAt,
      };
    });

    return { ...state, missions };
  },

  getActiveMission(state: QuestModeState): Mission | undefined {
    return state.missions.find(
      (m) => m.id === state.activeMissionId && m.status === "active"
    );
  },

  getMission(state: QuestModeState, missionId: string): Mission | undefined {
    return state.missions.find((m) => m.id === missionId);
  },

  getPendingMissions(state: QuestModeState): Mission[] {
    return state.missions.filter((m) => m.status === "briefed");
  },

  getCompletedMissions(state: QuestModeState): Mission[] {
    return state.missions.filter((m) => m.status === "completed");
  },

  isReadyToComplete(state: QuestModeState, missionId: string): boolean {
    const mission = state.missions.find((m) => m.id === missionId);
    if (!mission || mission.status !== "active") return false;
    return mission.objectives.length > 0 && mission.objectives.every((o) => o.completed);
  },
};

// ─── Named function exports (used by progress/route.ts) ──────────────────────

export function addMission(state: QuestModeState, mission: Mission): QuestModeState {
  return taskManager.addMission(state, mission);
}
export function completeObjective(
  state: QuestModeState,
  missionId: string,
  objectiveId: string
): QuestModeState {
  return taskManager.completeObjective(state, missionId, objectiveId);
}
export function completeMission(state: QuestModeState, missionId: string): QuestModeState {
  return taskManager.setMissionStatus(state, missionId, "completed");
}
export function abandonMission(state: QuestModeState, missionId: string): QuestModeState {
  return taskManager.setMissionStatus(state, missionId, "abandoned");
}
export function activateMission(state: QuestModeState, missionId: string): QuestModeState {
  return taskManager.setMissionStatus(state, missionId, "active");
}
export function getMission(state: QuestModeState, missionId: string): Mission | undefined {
  return taskManager.getMission(state, missionId);
}
export function isReadyToComplete(state: QuestModeState, missionId: string): boolean {
  return taskManager.isReadyToComplete(state, missionId);
}

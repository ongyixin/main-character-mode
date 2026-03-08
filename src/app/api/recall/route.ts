// POST /api/recall — Stateless character dialogue for the Collection index.
// No session required — accepts character data directly and returns a dialogue response.
// Accepts an optional browserContext field (sent by the Chrome extension) which injects
// the user's current browsing activity into the dialogue prompt.

import { NextRequest, NextResponse } from "next/server";
import { safeGenerateJSON } from "@/lib/shared/gemini";
import { dialoguePrompt } from "@/lib/shared/prompts";
import type { InteractionMode, SavedCharacter } from "@/types";

interface BrowserContext {
  currentUrl: string;
  currentTitle: string;
  currentDomain: string;
  selectedText?: string;
  activityDigest: string;
}

interface GroupContext {
  otherCharacters: Array<{
    name: string;
    personality: string;
    emotionalState: string;
  }>;
  recentMessages: Array<{
    speakerName: string;
    text: string;
  }>;
}

interface RecallRequest {
  character: SavedCharacter;
  interactionMode: InteractionMode;
  message: string;
  /** Optional browser context injected by the Chrome extension companion. */
  browserContext?: BrowserContext;
  /** Optional group context when multiple characters are in conversation. */
  groupContext?: GroupContext;
}

interface RecallResponse {
  response: string;
  relationshipDelta: number;
  newRelationshipToUser: number;
  emotionalStateUpdate: string;
}

interface DialogueResult {
  response: string;
  emotionalStateUpdate: string;
  relationshipDelta: number;
  hintAtMemory: string | null;
  triggerQuest: boolean;
  triggerEscalation: boolean;
}

function buildGroupContextBlock(ctx: GroupContext): string {
  const othersList = ctx.otherCharacters
    .map((c) => `- ${c.name} (${c.personality}), currently ${c.emotionalState}`)
    .join("\n");

  const recentLines = ctx.recentMessages
    .slice(-10)
    .map((m) => `${m.speakerName}: "${m.text}"`)
    .join("\n");

  return [
    "\n--- GROUP CONVERSATION ---",
    "You are in a group conversation. The following characters are also present:",
    othersList || "none",
    "",
    "Recent group conversation (most recent last):",
    recentLines || "(no messages yet)",
    "",
    "Instructions: Respond to the user's latest message. You may also react to or address",
    "what other characters just said — this makes the conversation feel alive.",
    "Stay in character. Keep your response to 2–3 sentences.",
    "---",
  ].join("\n");
}

function buildBrowserContextBlock(ctx: BrowserContext): string {
  const lines = [
    `Current page: "${ctx.currentTitle}" (${ctx.currentDomain})`,
    `URL: ${ctx.currentUrl}`,
    `Recent browsing: ${ctx.activityDigest}`,
  ];
  if (ctx.selectedText) {
    lines.push(`Selected text the user is asking about: "${ctx.selectedText.slice(0, 400)}"`);
  }
  return [
    "\n--- BROWSER CONTEXT (user is browsing the web right now) ---",
    ...lines,
    "Use this context to make your response feel relevant to what the user is doing.",
    "React naturally if the page relates to your personality or history with the user.",
    "---",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RecallRequest;
    const { character, interactionMode, message, browserContext, groupContext } = body;

    if (!character || !message) {
      return NextResponse.json({ error: "Missing character or message" }, { status: 400 });
    }

    // Build the context string injected into the dialoguePrompt's nearbyCharacters field.
    // Group context takes priority over the default solo label; browser context stacks on top.
    let nearbyContext: string;
    if (groupContext) {
      nearbyContext = buildGroupContextBlock(groupContext);
      if (browserContext) nearbyContext += buildBrowserContextBlock(browserContext);
    } else if (browserContext) {
      nearbyContext = `none — this is a private recall conversation${buildBrowserContextBlock(browserContext)}`;
    } else {
      nearbyContext = "none — this is a private recall conversation";
    }

    const prompt = dialoguePrompt(
      character.name,
      character.personality,
      character.voiceStyle,
      character.emotionalState,
      character.relationshipScore,
      character.memories,
      interactionMode,
      message,
      nearbyContext,
      character.genre,
      null
    );

    const result = await safeGenerateJSON<DialogueResult>(prompt);

    const delta = result?.relationshipDelta ?? 0;
    const newRelationshipToUser = Math.min(
      100,
      Math.max(-100, character.relationshipScore + delta)
    );

    const response: RecallResponse = {
      response: result?.response ?? `${character.name} regards you, saying nothing.`,
      relationshipDelta: delta,
      newRelationshipToUser,
      emotionalStateUpdate: result?.emotionalStateUpdate ?? character.emotionalState,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/recall]", err);
    return NextResponse.json({ error: "Recall failed" }, { status: 500 });
  }
}

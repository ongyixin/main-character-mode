"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { StoryQuest, ObjectCharacter } from "@/types";

interface QuestCardProps {
  quest: StoryQuest | null;
  issuedByCharacter?: ObjectCharacter;
  issuerName?: string;
  onAccept: (quest: StoryQuest) => void;
  onDecline: (quest: StoryQuest) => void;
}

const QUEST_TYPE_CONFIG: Record<
  StoryQuest["type"],
  { emoji: string; label: string; color: string; borderColor: string }
> = {
  fetch:     { emoji: "📦", label: "FETCH QUEST",  color: "#FFDE00",               borderColor: "#B3A125" },
  social:    { emoji: "🗣️", label: "SOCIAL QUEST", color: "#B0C4FF",               borderColor: "#3B4CCA" },
  choice:    { emoji: "⚖️", label: "CHOICE QUEST", color: "#B0C4FF",               borderColor: "#3B4CCA" },
  challenge: { emoji: "⚔️", label: "CHALLENGE",    color: "rgba(255,100,100,0.9)", borderColor: "#CC0000" },
  survival:  { emoji: "🌀", label: "SURVIVAL",     color: "#FFDE00",               borderColor: "#CC0000" },
};

export function QuestCard({
  quest,
  issuedByCharacter,
  issuerName,
  onAccept,
  onDecline,
}: QuestCardProps) {
  if (!quest) return null;
  const typeConfig = QUEST_TYPE_CONFIG[quest.type];
  const displayIssuerName = issuedByCharacter?.name ?? issuerName;

  return (
    <motion.div
      className="absolute inset-x-3 bottom-32 z-[35]"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 280 }}
    >
      <div
        style={{
          border: `2px solid ${typeConfig.color}`,
          boxShadow: `4px 4px 0 ${typeConfig.borderColor}80`,
          background: "rgba(30,6,6,0.98)",
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{
            background: typeConfig.borderColor,
            borderBottom: `2px solid ${typeConfig.color}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{typeConfig.emoji}</span>
            <div>
              <p className="font-pixel text-base" style={{ color: typeConfig.color }}>
                {typeConfig.label} RECEIVED
              </p>
              {displayIssuerName && (
                <p className="font-vt text-xl" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Issued by {displayIssuerName}
                  {issuedByCharacter && `, ${issuedByCharacter.personality}`}
                </p>
              )}
            </div>
          </div>
          <motion.span
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xl"
          >
            📜
          </motion.span>
        </div>

        {/* Quest content */}
        <div className="px-4 py-4">
          <p className="font-pixel text-base mb-2 tracking-wider" style={{ color: "rgba(255,222,0,0.45)" }}>
            ★ QUEST AVAILABLE ★
          </p>
          <h3 className="font-pixel text-base leading-loose mb-2" style={{ color: "#FFF0B0" }}>
            {quest.title}
          </h3>
          <p className="font-vt text-base italic leading-snug" style={{ color: "rgba(255,255,255,0.65)" }}>
            &ldquo;{quest.description}&rdquo;
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onAccept(quest)}
            className="touch-target font-pixel active:translate-x-[2px] active:translate-y-[2px]"
            style={{
              background: "#CC0000",
              border: "2px solid #FFDE00",
              boxShadow: "3px 3px 0 rgba(255,222,0,0.4)",
              color: "#FFDE00",
              fontSize: "11px",
              letterSpacing: "0.08em",
              padding: "12px 8px",
              transition: "box-shadow 0.05s, transform 0.05s",
            }}
          >
            ▶ ACCEPT
          </button>
          <button
            onClick={() => onDecline(quest)}
            className="touch-target font-pixel active:translate-x-[1px] active:translate-y-[1px]"
            style={{
              background: "transparent",
              border: "2px solid rgba(255,255,255,0.2)",
              boxShadow: "2px 2px 0 rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
              fontSize: "11px",
              letterSpacing: "0.08em",
              padding: "10px 8px",
              transition: "box-shadow 0.05s, transform 0.05s",
            }}
          >
            ✕ DECLINE
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default QuestCard;

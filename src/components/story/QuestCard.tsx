"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { StoryQuest, ObjectCharacter } from "@/types";

interface QuestCardProps {
  quest: StoryQuest | null;
  issuedByCharacter?: ObjectCharacter;
  /** Compatibility: story/page.tsx passes issuerName as a string */
  issuerName?: string;
  onAccept: (quest: StoryQuest) => void;
  onDecline: (quest: StoryQuest) => void;
}

const QUEST_TYPE_CONFIG: Record<
  StoryQuest["type"],
  { emoji: string; label: string; color: string }
> = {
  fetch: { emoji: "📦", label: "Fetch Quest", color: "text-amber-400" },
  social: { emoji: "🗣️", label: "Social Quest", color: "text-blue-400" },
  choice: { emoji: "⚖️", label: "Choice Quest", color: "text-violet-400" },
  challenge: { emoji: "⚔️", label: "Challenge", color: "text-rose-400" },
  survival: { emoji: "🌀", label: "Survival", color: "text-orange-400" },
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
      className="absolute inset-x-4 bottom-32 z-[35]"
      initial={{ y: 80, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 40, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", damping: 24, stiffness: 280 }}
    >
      <div className="glass-story rounded-2xl overflow-hidden border-glow-story">
        {/* Header band */}
        <div className="bg-gradient-to-r from-[#7b3fc4]/60 to-[#c89b3c]/30 px-4 py-2.5 flex items-center gap-2">
          <span className="text-lg">{typeConfig.emoji}</span>
          <div>
            <p className={cn("font-mono-dm text-[10px] tracking-widest uppercase", typeConfig.color)}>
              {typeConfig.label} Received
            </p>
            {displayIssuerName && (
              <p className="font-body text-white/50 text-[10px]">
                Issued by {displayIssuerName}
                {issuedByCharacter && `, ${issuedByCharacter.personality}`}
              </p>
            )}
          </div>
          {/* Dramatic flourish */}
          <div className="ml-auto">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xl"
            >
              📜
            </motion.div>
          </div>
        </div>

        {/* Quest content */}
        <div className="px-4 py-4">
          <h3 className="font-display text-[#f0d898] text-lg font-bold leading-tight text-glow-story mb-2">
            {quest.title}
          </h3>
          <p className="font-body text-white/80 text-sm leading-relaxed italic">
            "{quest.description}"
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onAccept(quest)}
            className={cn(
              "touch-target rounded-xl py-3 font-body font-semibold text-sm",
              "bg-gradient-to-r from-[#7b3fc4] to-[#c89b3c]",
              "text-white shadow-[0_4px_16px_rgba(123,63,196,0.4)]",
              "active:scale-95 transition-transform"
            )}
          >
            Accept ✦
          </button>
          <button
            onClick={() => onDecline(quest)}
            className={cn(
              "touch-target rounded-xl py-3 font-body text-sm",
              "glass border border-white/10 text-white/60 hover:text-white/90",
              "active:scale-95 transition-all"
            )}
          >
            Decline
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default QuestCard;

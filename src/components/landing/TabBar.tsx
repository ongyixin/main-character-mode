"use client";

import { motion } from "framer-motion";
import {
  PlayIcon,
  QuestionIcon,
  InfoIcon,
  ShieldIcon,
  GearIcon,
  SoundOnIcon,
  SoundOffIcon,
} from "./PixelIcons";

export type TabId = "play" | "howtoplay" | "about" | "community" | "settings";

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

interface TabDef {
  id: TabId;
  Icon: IconComponent;
  label: string;
  key: string;
}

const TABS: TabDef[] = [
  { id: "play",      Icon: PlayIcon,     label: "PLAY",  key: "1" },
  { id: "howtoplay", Icon: QuestionIcon, label: "GUIDE", key: "2" },
  { id: "about",     Icon: InfoIcon,     label: "ABOUT", key: "3" },
  { id: "community", Icon: ShieldIcon,   label: "GUILD", key: "4" },
  { id: "settings",  Icon: GearIcon,     label: "OPT.",  key: "5" },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
}

export default function TabBar({
  activeTab,
  onTabChange,
  soundEnabled,
  onSoundToggle,
}: TabBarProps) {
  return (
    <div
      className="relative"
      style={{
        background: "rgba(4,1,16,0.97)",
        borderBottom: "2px solid rgba(255,222,0,0.28)",
        zIndex: 20,
        paddingTop: "max(6px, env(safe-area-inset-top))",
      }}
    >
      {/* Top micro bar */}
      <div
        className="font-pixel"
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "3px 12px 0",
          fontSize: 16,
          color: "rgba(255,222,0,0.18)",
          letterSpacing: "0.3em",
        }}
      >
        <span>MAIN CHARACTER MODE</span>
        <span>VER 1.0</span>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const iconColor = isActive ? "#FFDE00" : "rgba(255,255,255,0.28)";
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                flex: 1,
                padding: "7px 2px 9px",
                background: isActive
                  ? "rgba(255,222,0,0.10)"
                  : "transparent",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.12s",
                borderRight: "1px solid rgba(255,222,0,0.07)",
              }}
            >
              {/* Pixel icon */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 14,
                  marginBottom: 3,
                  transition: "color 0.12s",
                }}
              >
                <tab.Icon size={14} color={iconColor} />
              </div>
              {/* Label */}
              <div
                className="font-pixel"
                style={{
                  fontSize: 16,
                  letterSpacing: "0.06em",
                  color: isActive ? "#FFDE00" : "rgba(255,255,255,0.28)",
                  transition: "color 0.12s",
                  lineHeight: 1,
                }}
              >
                {tab.label}
              </div>
              {/* Key hint */}
              <div
                className="font-pixel"
                style={{
                  fontSize: 16,
                  color: "rgba(255,222,0,0.15)",
                  marginTop: 3,
                  lineHeight: 1,
                }}
              >
                [{tab.key}]
              </div>

              {/* Active gold underline — animated */}
              {isActive && (
                <motion.div
                  layoutId="tab-underline"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "#FFDE00",
                    boxShadow: "0 0 6px rgba(255,222,0,0.6)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          );
        })}

        {/* Sound toggle — right side */}
        <button
          onClick={onSoundToggle}
          style={{
            width: 44,
            background: "transparent",
            border: "none",
            borderLeft: "1px solid rgba(255,222,0,0.1)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            padding: "7px 6px 9px",
            flexShrink: 0,
          }}
          title={soundEnabled ? "Sound ON" : "Sound OFF"}
        >
          <div style={{ display: "flex", alignItems: "center", height: 14 }}>
            {soundEnabled
              ? <SoundOnIcon size={14} color="#FFDE00" />
              : <SoundOffIcon size={14} color="rgba(255,255,255,0.22)" />
            }
          </div>
          <div
            className="font-pixel"
            style={{ fontSize: 16, color: soundEnabled ? "rgba(255,222,0,0.5)" : "rgba(255,255,255,0.15)", lineHeight: 1 }}
          >
            {soundEnabled ? "ON" : "OFF"}
          </div>
        </button>
      </div>
    </div>
  );
}

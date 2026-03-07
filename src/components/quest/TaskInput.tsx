"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskInputProps {
  onSubmit: (taskText: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

export default function TaskInput({
  onSubmit,
  isLoading = false,
  placeholder = "Add a task (do laundry, buy groceries...)",
}: TaskInputProps) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    await onSubmit(trimmed);
    setText("");
    setFocused(false);
    inputRef.current?.blur();
  }

  const hasText = text.trim().length > 0;

  return (
    <motion.div layout>
      {/* Main panel */}
      <div
        style={{
          border: `2px solid ${focused ? "#FFDE00" : "#3B4CCA"}`,
          background: "rgba(6,8,30,0.98)",
          boxShadow: focused ? "3px 3px 0 rgba(255,222,0,0.3)" : "3px 3px 0 rgba(59,76,202,0.4)",
          transition: "border-color 0.1s, box-shadow 0.1s",
        }}
      >
        {/* Header chrome */}
        <div
          className="px-3 py-1.5"
          style={{ borderBottom: "1px solid rgba(255,222,0,0.15)", background: "rgba(59,76,202,0.3)" }}
        >
          <span className="font-pixel text-base tracking-wider" style={{ color: "rgba(255,222,0,0.5)" }}>
            ▸ NEW MISSION INPUT
          </span>
        </div>

        <div className="flex items-center gap-3 px-3 py-3">
          {/* Icon */}
          <div
            className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-pixel text-base"
            style={{
              border: "2px solid rgba(255,222,0,0.35)",
              background: "rgba(255,222,0,0.06)",
              color: "#FFDE00",
            }}
          >
            +
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => !text && setFocused(false)}
            placeholder={placeholder}
            className="flex-1 bg-transparent font-vt text-lg outline-none"
            style={{
              color: "#B0C4FF",
              caretColor: "#FFDE00",
            } as React.CSSProperties}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") {
                setText("");
                setFocused(false);
                inputRef.current?.blur();
              }
            }}
            disabled={isLoading}
          />

          {/* Submit button */}
          <AnimatePresence>
            {(hasText || focused) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.12 }}
                onClick={handleSubmit}
                disabled={!hasText || isLoading}
                className="w-9 h-9 flex items-center justify-center flex-shrink-0 font-pixel touch-target"
                style={{
                  background: hasText && !isLoading ? "#FFDE00" : "rgba(255,222,0,0.1)",
                  border: `2px solid ${hasText && !isLoading ? "#1a2880" : "rgba(255,222,0,0.2)"}`,
                  boxShadow: hasText && !isLoading ? "2px 2px 0 rgba(26,40,128,0.5)" : "none",
                  color: hasText && !isLoading ? "#0a0e30" : "rgba(255,222,0,0.3)",
                  fontSize: "16px",
                  transition: "all 0.1s",
                }}
              >
                {isLoading ? (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "linear", repeatType: "mirror" }}
                    style={{ fontSize: 16 }}
                  >
                    ■
                  </motion.span>
                ) : (
                  "▶"
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3 pb-3"
            >
              <div
                className="flex items-center gap-3 px-3 py-2"
                style={{ border: "1px solid rgba(255,222,0,0.2)", background: "rgba(255,222,0,0.05)" }}
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5"
                      style={{ background: "#FFDE00" }}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }}
                    />
                  ))}
                </div>
                <span className="font-pixel text-base tracking-wider" style={{ color: "rgba(255,222,0,0.6)" }}>
                  FRAMING MISSION...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint text */}
      {!focused && !text && (
        <p className="font-pixel text-base text-center mt-2" style={{ color: "rgba(255,255,255,0.15)" }}>
          ENTER TASK TO BEGIN MISSION
        </p>
      )}
    </motion.div>
  );
}

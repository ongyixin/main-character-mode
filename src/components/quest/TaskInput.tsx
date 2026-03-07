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
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    await onSubmit(trimmed);
    setText("");
    setExpanded(false);
    inputRef.current?.blur();
  }

  return (
    <motion.div
      layout
      className="mx-4 rounded-2xl overflow-hidden"
      style={{
        background: "rgba(2, 13, 20, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(0,212,255,0.2)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}
        >
          <span className="text-sm">+</span>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setExpanded(true)}
          onBlur={() => !text && setExpanded(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent font-body text-sm text-white placeholder-white/25 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") {
              setText("");
              setExpanded(false);
              inputRef.current?.blur();
            }
          }}
          disabled={isLoading}
        />

        {/* Submit button */}
        <AnimatePresence>
          {(text.trim() || expanded) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleSubmit}
              disabled={!text.trim() || isLoading}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 touch-target"
              style={{
                background:
                  text.trim() && !isLoading
                    ? "linear-gradient(135deg, #0066aa, #00d4ff)"
                    : "rgba(255,255,255,0.06)",
              }}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 rounded-full border border-white/30 border-t-white"
                />
              ) : (
                <span
                  className="text-xs font-bold"
                  style={{ color: text.trim() ? "#000" : "rgba(255,255,255,0.2)" }}
                >
                  →
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.12)" }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ background: "#00d4ff" }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] tracking-widest text-quest-accent uppercase">
                Framing mission...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

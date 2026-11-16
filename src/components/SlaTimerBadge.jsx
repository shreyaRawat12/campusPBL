import React, { useState, useEffect } from "react";
import { getRemainingSlaSeconds, formatTimerDisplay, DEFAULT_SLA_SECONDS } from "../utils/osScheduler";

export default function SlaTimerBadge({ createdAt, slaExpiresAt, slaLimitSeconds = DEFAULT_SLA_SECONDS, onExpired }) {
  const calculateRemaining = () => {
    if (slaExpiresAt) {
      const expMs = new Date(slaExpiresAt).getTime();
      return Math.max(0, Math.floor((expMs - Date.now()) / 1000));
    }
    return getRemainingSlaSeconds(createdAt, slaLimitSeconds);
  };

  const [remaining, setRemaining] = useState(calculateRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      const rem = calculateRemaining();
      setRemaining(rem);
      if (rem <= 0 && onExpired) {
        onExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt, slaExpiresAt, slaLimitSeconds, onExpired]);

  if (remaining <= 0) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          background: "rgba(139, 92, 246, 0.2)",
          color: "#c084fc",
          border: "1px solid rgba(139, 92, 246, 0.4)",
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "0.74rem",
          fontWeight: "700",
        }}
        title="Admin SLA expired. Candidate for Autonomous OS Scheduler auto-allocation."
      >
        <span>⚡</span> OS Auto-Dispatch Ready
      </span>
    );
  }

  const isUrgent = remaining < 120; // less than 2 minutes

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: isUrgent ? "rgba(239, 68, 68, 0.15)" : "rgba(56, 189, 248, 0.12)",
        color: isUrgent ? "#f87171" : "#38bdf8",
        border: `1px solid ${isUrgent ? "rgba(239, 68, 68, 0.35)" : "rgba(56, 189, 248, 0.3)"}`,
        padding: "3px 9px",
        borderRadius: "6px",
        fontSize: "0.76rem",
        fontWeight: "600",
        fontVariantNumeric: "tabular-nums",
      }}
      title="Admin SLA Timer: If not decided within 10 minutes, the OS Scheduler allocates automatically."
    >
      <span>{isUrgent ? "⏱️" : "⏳"}</span>
      <span>SLA: {formatTimerDisplay(remaining)}</span>
    </span>
  );
}

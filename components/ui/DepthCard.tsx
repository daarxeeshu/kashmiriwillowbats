"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DepthCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}

export function DepthCard({
  children,
  className,
  intensity = 12,
  glare = true,
}: DepthCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const frameRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        const rotX = -dy * intensity;
        const rotY = dx * intensity;
        setTransform(
          `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02,1.02,1.02)`
        );
        const gx = ((e.clientX - rect.left) / rect.width) * 100;
        const gy = ((e.clientY - rect.top) / rect.height) * 100;
        setGlarePos({ x: gx, y: gy, opacity: 0.18 });
      });
    },
    [intensity]
  );

  const handleMouseLeave = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setTransform(
      "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
    );
    setGlarePos((p) => ({ ...p, opacity: 0 }));
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative will-change-transform", className)}
      style={{
        transform,
        transition: transform.includes("0deg")
          ? "transform 0.6s cubic-bezier(0.22,1,0.36,1)"
          : "transform 0.08s linear",
        transformStyle: "preserve-3d",
      }}
    >
      {children}

      {glare && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
          style={{ zIndex: 10 }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}) 0%, transparent 65%)`,
              transition: "opacity 0.15s ease",
              borderRadius: "inherit",
            }}
          />
        </div>
      )}
    </div>
  );
}

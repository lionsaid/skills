"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

type GlareCardProps = {
  children: ReactNode;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function GlareCard({ children, className = "" }: GlareCardProps) {
  const [style, setStyle] = useState<CSSProperties>({
    "--glare-x": "50%",
    "--glare-y": "50%",
    "--rotate-x": "0deg",
    "--rotate-y": "0deg",
  } as CSSProperties);

  return (
    <div
      className={`glare-card ${className}`.trim()}
      onMouseLeave={() =>
        setStyle({
          "--glare-x": "50%",
          "--glare-y": "50%",
          "--rotate-x": "0deg",
          "--rotate-y": "0deg",
        } as CSSProperties)
      }
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        const rotateY = clamp(((x - 50) / 50) * 8, -8, 8);
        const rotateX = clamp(((50 - y) / 50) * 8, -8, 8);

        setStyle({
          "--glare-x": `${x}%`,
          "--glare-y": `${y}%`,
          "--rotate-x": `${rotateX}deg`,
          "--rotate-y": `${rotateY}deg`,
        } as CSSProperties);
      }}
      style={style}
    >
      <div className="glare-card-inner">{children}</div>
    </div>
  );
}

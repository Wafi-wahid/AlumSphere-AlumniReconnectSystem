import React from "react";

export function BrandLoader({ label = "Loading..." }: { label?: string }) {
  const dots = Array.from({ length: 12 }).map((_, i) => i);
  const radius = 28; // px
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="relative h-20 w-20 animate-spin" aria-hidden>
        {dots.map((i) => {
          const angle = (i / dots.length) * 360;
          const isYellow = i % 2 === 0;
          const color = isYellow ? "#FFB800" : "#0b1b3a";
          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 block h-3 w-3 -ml-1.5 -mt-1.5 rounded-full shadow"
              style={{
                backgroundColor: color,
                transform: `rotate(${angle}deg) translate(${radius}px)`
              }}
            />
          );
        })}
      </div>
      <div className="text-sm font-medium text-white/90">{label}</div>
    </div>
  );
}

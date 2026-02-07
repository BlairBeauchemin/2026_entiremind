"use client";

import { motion } from "framer-motion";

interface SacredGeometryVisualProps {
  className?: string;
  size?: number;
}

export function SacredGeometryVisual({
  className = "",
  size = 600,
}: SacredGeometryVisualProps) {
  const center = size / 2;
  const radius = size * 0.38;
  const smallRadius = radius * 0.618; // Golden ratio

  // Generate points for the Flower of Life pattern
  const flowerPoints = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    flowerPoints.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }

  // Generate points for the inner hexagon
  const hexagonPoints = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    hexagonPoints.push({
      x: center + smallRadius * Math.cos(angle),
      y: center + smallRadius * Math.sin(angle),
    });
  }

  // Create the hexagon path
  const hexagonPath = hexagonPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + " Z";

  // Metatron's cube connecting lines
  const metatronLines = [];
  for (let i = 0; i < flowerPoints.length; i++) {
    for (let j = i + 1; j < flowerPoints.length; j++) {
      metatronLines.push({
        x1: flowerPoints[i].x,
        y1: flowerPoints[i].y,
        x2: flowerPoints[j].x,
        y2: flowerPoints[j].y,
      });
    }
    // Connect to center
    metatronLines.push({
      x1: flowerPoints[i].x,
      y1: flowerPoints[i].y,
      x2: center,
      y2: center,
    });
  }

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      {/* Outer rotating layer */}
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="geometry-rotate absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* Outer circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="geometry-line"
        />

        {/* Flower of Life circles */}
        {flowerPoints.map((point, i) => (
          <circle
            key={`flower-${i}`}
            cx={point.x}
            cy={point.y}
            r={radius * 0.5}
            className="geometry-line"
          />
        ))}

        {/* Central circle */}
        <circle
          cx={center}
          cy={center}
          r={radius * 0.5}
          className="geometry-line"
        />
      </motion.svg>

      {/* Inner counter-rotating layer */}
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="geometry-rotate-reverse absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
      >
        {/* Metatron's cube lines */}
        {metatronLines.map((line, i) => (
          <line
            key={`metatron-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="geometry-line-teal"
          />
        ))}

        {/* Inner hexagon */}
        <path
          d={hexagonPath}
          className="geometry-line-teal"
          strokeWidth="0.75"
        />
      </motion.svg>

      {/* Static center glow */}
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
      >
        {/* Glowing intersection points */}
        <circle
          cx={center}
          cy={center}
          r={4}
          fill="#f9d97a"
          className="geometry-pulse geometry-glow"
        />
        {flowerPoints.map((point, i) => (
          <circle
            key={`glow-${i}`}
            cx={point.x}
            cy={point.y}
            r={3}
            fill="#f9d97a"
            opacity={0.6}
            className="geometry-pulse"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </motion.svg>
    </div>
  );
}

// Smaller decorative version for section accents
export function SacredGeometryAccent({
  className = "",
  size = 200,
}: SacredGeometryVisualProps) {
  const center = size / 2;
  const radius = size * 0.4;

  // Simple hexagon
  const hexagonPoints = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    hexagonPoints.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }

  const hexagonPath =
    hexagonPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ") + " Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      <circle cx={center} cy={center} r={radius} className="geometry-line" />
      <path d={hexagonPath} className="geometry-line-teal" />
      <circle
        cx={center}
        cy={center}
        r={radius * 0.5}
        className="geometry-line"
      />
    </svg>
  );
}

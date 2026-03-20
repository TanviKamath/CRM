"use client";

import { useEffect, useState } from "react";

export default function CircularLoader({ message = "Loading...", size = 120, fullScreen = true }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fake progress animation from 0 to 99%
    // Slows down as it gets closer to 99%
    let current = 0;
    const interval = setInterval(() => {
      current += (99 - current) * 0.15;
      if (current >= 98.5) current = 99;
      setProgress(Math.floor(current));
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center">
      <div style={{ position: "relative", width: size, height: size }}>
        {/* Background circle */}
        <svg fill="none" viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e5ea"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#0071e3"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
        {/* Percentage text */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.22, fontWeight: "800", color: "#1d1d1f",
          letterSpacing: "-0.02em"
        }}>
          {progress}%
        </div>
      </div>
      <div className="mt-4 fw-bold" style={{ fontSize: "1.05rem", color: "#86868b", animation: "pulse 1.5s infinite" }}>
        {message}
      </div>
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: "#f5f5f7" }}>
        {content}
      </div>
    );
  }

  return content;
}

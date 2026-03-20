export default function Skeleton({ width = "100%", height = 16, className = "", style = {} }) {
  return (
    <div
      className={`skel ${className}`}
      style={{ width, height, ...style }}
    >
      <style>{`
        .skel {
          background: linear-gradient(90deg, #f0f0f2 25%, #e8e8ed 50%, #f0f0f2 75%);
          background-size: 200% 100%;
          border-radius: 6px;
          display: inline-block;
          animation: skel 1.5s infinite;
        }
        @keyframes skel {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

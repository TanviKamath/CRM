"use client";

import { useState, useRef, useEffect } from "react";

export default function CollapsibleSection({
  title,
  id,
  isOpen = false,
  children,
}) {
  const [open, setOpen] = useState(isOpen);
  const contentRef = useRef(null);

  const toggle = () => setOpen(!open);

  useEffect(() => {
    if (contentRef.current) {
      if (open) {
        contentRef.current.style.maxHeight = contentRef.current.scrollHeight + "px";
      } else {
        contentRef.current.style.maxHeight = "0px";
      }
    }
  }, [open]);

  return (
    <div className="card mb-4">
      {/* HEADER */}
      <div
        className="card-header"
        style={{ cursor: "pointer" }}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
      >
        <h5 className="mb-0 d-flex justify-content-between align-items-center">
          {title}
          <i
            className="fas fa-chevron-down"
            style={{
              transition: "0.3s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          ></i>
        </h5>
      </div>

      {/* COLLAPSIBLE CONTENT */}
      <div
        id={id}
        ref={contentRef}
        className={`collapse-content`}
        style={{
          overflow: "hidden",
          transition: "max-height 0.35s ease",
          maxHeight: open ? "1000px" : "0px",
        }}
      >
        <div className="card-body">
          {children}
        </div>
      </div>
    </div>
  );
}

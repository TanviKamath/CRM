import React from "react";

export default function ActionButton({ onClick, variant, icon, title, disabled = false, loading = false, className = "", style = {} }) {
  const isOutline = variant.includes("outline");
  const baseColor = variant.replace("outline-", "").split(" ")[0];
  
  // Custom mapping for colors from the screenshot
  const colorMap = {
    info: "#0dcaf0",
    primary: "#0d6efd",
    success: "#198754",
    danger: "#dc3545",
    warning: "#ffc107",
    secondary: "#6c757d",
    dark: "#212529"
  };

  const themeColor = colorMap[baseColor] || "#6c757d";

  const containerStyle = {
    borderRadius: "12px",
    width: "40px",
    height: "40px",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    border: `1.5px solid ${themeColor}`,
    backgroundColor: isOutline ? "transparent" : themeColor,
    color: isOutline ? themeColor : "#ffffff",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    ...style
  };

  const iconStyle = {
    fontSize: "1.2rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const content = loading ? (
    <span className="spinner-border spinner-border-sm" role="status" />
  ) : (
    <i className={`bi ${icon}`} style={iconStyle} />
  );

  return (
    <button
      type="button"
      className={`action-btn-styled ${className}`}
      style={containerStyle}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = `0 4px 12px ${themeColor}33`;
          if (isOutline) {
            e.currentTarget.style.backgroundColor = `${themeColor}11`;
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
          if (isOutline) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }
      }}
    >
      {content}
    </button>
  );
}

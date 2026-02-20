import { useState } from "react";
import { Download, Eye, EyeOff } from "lucide-react";
import styles from "./excelMerger.module.css";

// ─── Editable Cell ────────────────────────────────────────────────────────────
function EditableCell({ value, rowIndex, columnName, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  const raw = value === "-" ? "" : value;

  const isNumeric =
    raw !== "" &&
    raw !== null &&
    raw !== undefined &&
    !isNaN(Number(raw)) &&
    isFinite(Number(raw)) &&
    String(raw).trim() !== "";

  const handleDoubleClick = () => {
    if (!isNumeric) return;
    setDraft(raw);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const parsed = Number(draft);
    if (!isNaN(parsed) && String(parsed) !== String(raw)) {
      onEdit(rowIndex, columnName, parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter")  e.target.blur();
    if (e.key === "Escape") { setDraft(raw); setEditing(false); }
  };

  if (editing) {
    return (
      <div style={{ position: "relative", zIndex: 200 }}>
        {/* Inject animation once */}
        <style>{`
          @keyframes cellPopIn {
            from { opacity: 0; transform: scale(0.93) translateY(-3px); }
            to   { opacity: 1; transform: scale(1)    translateY(0);    }
          }
        `}</style>

        {/* Pop-out card — breaks free from narrow cell */}
        <div style={{
          position: "absolute",
          top: "-8px",
          left: "-10px",
          minWidth: "180px",
          width: "max-content",
          background: "#ffffff",
          borderRadius: "10px",
          border: "1.5px solid #bfdbfe",
          boxShadow: "0 8px 24px rgba(59,130,246,0.18), 0 2px 8px rgba(0,0,0,0.08)",
          padding: "10px 12px 32px 12px",
          animation: "cellPopIn 0.15s cubic-bezier(0.22,1,0.36,1)",
        }}>
          {/* Column label */}
          <div style={{
            fontSize: "10px",
            fontWeight: "700",
            color: "#3b82f6",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "6px",
            userSelect: "none",
          }}>
            {columnName}
          </div>

          <input
            autoFocus
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              minWidth: "150px",
              border: "2px solid #3b82f6",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#1e40af",
              background: "#eff6ff",
              outline: "none",
              boxSizing: "border-box",
              boxShadow: "0 0 0 3px rgba(59,130,246,0.15)",
            }}
          />

          {/* Hint bar */}
          <div style={{
            position: "absolute",
            bottom: "8px",
            left: "12px",
            right: "12px",
            fontSize: "10px",
            color: "#94a3b8",
            display: "flex",
            gap: "8px",
            userSelect: "none",
          }}>
            <span style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "3px", padding: "1px 5px", color: "#475569" }}>Enter</span>
            <span style={{ color: "#cbd5e1" }}>to save</span>
            <span style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "3px", padding: "1px 5px", color: "#475569" }}>Esc</span>
            <span style={{ color: "#cbd5e1" }}>to cancel</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      title={isNumeric ? "Double-click to edit" : undefined}
      style={{
        cursor: isNumeric ? "text" : "default",
        display: "block",
        minWidth: "40px",
        borderRadius: "4px",
        padding: "1px 2px",
        transition: "background 0.15s ease",
      }}
    >
      {value ?? ""}
    </span>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function PreviewSection({
  mergedData,
  visibleHeaders,
  hiddenColumns,
  toggleColumn,
  removeEmptyColumns,
  numericColumn,
  setNumericColumn,
  numericDelta,
  setNumericDelta,
  applyNumericDelta,
  exportToExcel,
  loading,
  showSpecificColumnsOnly,
  setShowSpecificColumnsOnly,
  originalHiddenColumns,
  setOriginalHiddenColumns,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  onCellEdit,
}) {

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalRows     = mergedData.rows.length;
  const totalPages    = Math.ceil(totalRows / rowsPerPage);
  const startIndex    = (currentPage - 1) * rowsPerPage;
  const endIndex      = Math.min(startIndex + rowsPerPage, totalRows);
  const paginatedRows = mergedData.rows.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  // ── Key columns ─────────────────────────────────────────────────────────────
  const specificColumns = [
    "Sr No", "Shape", "Weight", "Color", "Clarity", "Polish",
    "Symmetry", "Fluro", "Discount", "Measurement", "Depth",
    "Table", "Ratio", "Key To Symbols", "Add Comments", "Luster",
  ];

  // ── Numeric column detection ─────────────────────────────────────────────────
  const isNumericColumn = (columnName) => {
    if (!mergedData?.rows) return false;
    let numericCount = 0, totalChecked = 0;
    for (let i = 0; i < mergedData.rows.length && totalChecked < 10; i++) {
      const value = mergedData.rows[i][columnName];
      if (value === null || value === undefined || String(value).trim() === "") continue;
      totalChecked++;
      const num = Number(value);
      if (!isNaN(num) && isFinite(num)) numericCount++;
    }
    return totalChecked > 0 && numericCount / totalChecked >= 0.8;
  };

  const getNumericColumns = () =>
    mergedData ? mergedData.headers.filter((h) => isNumericColumn(h)) : [];

  // ── Key-columns-only toggle ──────────────────────────────────────────────────
  const toggleSpecificColumns = () => {
    const newMode = !showSpecificColumnsOnly;
    setShowSpecificColumnsOnly(newMode);

    if (newMode) {
      setOriginalHiddenColumns(new Set(hiddenColumns));
      mergedData.headers.forEach((header) => {
        const isKey = specificColumns.includes(header);
        const isCurrentlyHidden = hiddenColumns.has(header);
        if (!isKey && !isCurrentlyHidden) toggleColumn(header);
      });
    } else {
      mergedData.headers.forEach((header) => {
        const isCurrentlyHidden = hiddenColumns.has(header);
        const shouldBeHidden    = originalHiddenColumns.has(header);
        if (isCurrentlyHidden !== shouldBeHidden) toggleColumn(header);
      });
    }
  };

  const displayHeaders = visibleHeaders;

  const getColumnButtonStyle = (header) => {
    const isHidden = hiddenColumns.has(header);
    const isKeyCol = specificColumns.includes(header);

    if (showSpecificColumnsOnly) {
      if (isKeyCol) {
        return { background: isHidden ? "#fed7d7" : "#c6f6d5", cursor: "pointer", border: "2px solid #38a169", fontWeight: "600" };
      }
      return { background: isHidden ? "#fed7d7" : "#bee3f8", cursor: "pointer", opacity: isHidden ? 0.7 : 1 };
    }
    return { background: isHidden ? "#fed7d7" : "#c6f6d5", cursor: "pointer" };
  };

  return (
    <div>

      {/* ── Header row ────────────────────────────────────────────────────────── */}
      <div className={styles.previewTop}>
        <h3 className={styles.sectionTitle}>
          Merged Data ({totalRows} rows total)
          <span style={{ fontSize: "14px", fontWeight: "normal", marginLeft: "10px", color: "#666" }}>
            Showing {startIndex + 1}–{endIndex} of {totalRows}
          </span>
        </h3>
        <div className={styles.previewButtons}>
          <button className={styles.button} onClick={() => exportToExcel()}>
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      {/* ── Rows per page ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
        <label style={{ fontWeight: 600 }}>Rows per page:</label>
        <select
          value={rowsPerPage}
          onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
          className={styles.input}
          style={{ maxWidth: 120, padding: "6px" }}
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={250}>250</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
          <option value={totalRows}>All ({totalRows})</option>
        </select>
      </div>

      {/* ── Column Controls ───────────────────────────────────────────────────── */}
      <div className={styles.controlsBox}>
        <div className={styles.controlsHeader}>
          <h4 style={{ margin: 0, fontWeight: 700 }}>Column Controls</h4>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className={`${styles.button} ${showSpecificColumnsOnly ? styles.blue : styles.purple}`}
              onClick={toggleSpecificColumns}
            >
              {showSpecificColumnsOnly ? <EyeOff size={18} /> : <Eye size={18} />}
              {showSpecificColumnsOnly ? "Show All Columns" : "Show Key Columns Only"}
            </button>
            <button className={`${styles.button} ${styles.purple}`} onClick={removeEmptyColumns}>
              Remove Empty Columns
            </button>
          </div>
        </div>

        {showSpecificColumnsOnly && (
          <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f7fafc", borderRadius: "6px", fontSize: "14px" }}>
            <p style={{ margin: 0, color: "#4a5568" }}>
              <strong>Key Columns Mode:</strong> The 16 key columns are shown with green borders and are visible by default.
              Other columns are hidden (red) but you can click any to make them visible. Clicking "Show All Columns" will restore your original column settings.
            </p>
          </div>
        )}

        <div className={styles.columnButtons}>
          {mergedData.headers.map((h) => (
            <button key={h} onClick={() => toggleColumn(h)} className={styles.colToggle} style={getColumnButtonStyle(h)}>
              {hiddenColumns.has(h) ? "❌ Hidden" : "✅ Show"} : {h}
            </button>
          ))}
        </div>
      </div>

      {/* ── Numeric Adjuster ──────────────────────────────────────────────────── */}
      <div className={styles.controlsBoxLight}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Numeric Column Adjuster</h4>
        <p className={styles.helperTextSmall}>
          Example: Select <b>Rate</b> and set <b>+2</b> to increase every row rate by 2. Only numeric columns are shown.
        </p>
        <div className={styles.numericRow}>
          <select
            value={numericColumn}
            onChange={(e) => setNumericColumn(e.target.value)}
            className={styles.input}
            style={{ maxWidth: 250 }}
          >
            <option value="">Select Numeric Column</option>
            {getNumericColumns().map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <input
            type="number"
            value={numericDelta}
            onChange={(e) => setNumericDelta(e.target.value)}
            className={styles.input}
            style={{ maxWidth: 180 }}
            placeholder="+2 or -5"
          />
          <button className={`${styles.button} ${styles.blue}`} onClick={applyNumericDelta}>
            Apply
          </button>
        </div>
      </div>

      {/* ── Tip Banner ────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        background: "#fffbe6",
        border: "1px solid #ffe58f",
        borderRadius: "8px",
        padding: "10px 16px",
        marginBottom: "16px",
        fontSize: "13px",
        color: "#7c5a00",
      }}>
        <strong style={{ marginRight: "6px" }}>Tip:</strong>
        Double-click any numeric cell to edit its value inline. Press{" "}
        <kbd style={{ background: "#eee", color: "#1a1a1a", border: "1px solid #ccc", borderRadius: "3px", padding: "1px 6px", margin: "0 4px" }}>Enter</kbd>
        to save or{" "}
        <kbd style={{ background: "#eee", color: "#1a1a1a",border: "1px solid #ccc", borderRadius: "3px", padding: "1px 6px", margin: "0 4px" }}>Esc</kbd>
        to cancel. Edits are included when you export to Excel.
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              {displayHeaders.map((header) => (
                <th key={header} className={styles.th}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => {
              const actualRowIndex = startIndex + idx;
              return (
                <tr key={actualRowIndex} className={styles.tr}>
                  {displayHeaders.map((header) => {
                    const cellValue    = row[header] ?? "";
                    const displayValue = cellValue === "" ? "-" : cellValue;
                    const link         = mergedData?.hyperlinks?.[actualRowIndex]?.[header];

                    return (
                      <td key={header} className={styles.td} style={{ overflow: "visible" }}>
                        {link ? (
                          <a href={link} target="_blank" rel="noreferrer" className={styles.linkCell}>
                            {displayValue}
                          </a>
                        ) : (
                          <EditableCell
                            value={displayValue}
                            rowIndex={actualRowIndex}
                            columnName={header}
                            onEdit={onCellEdit}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => goToPage(1)} disabled={currentPage === 1} className={styles.button}
            style={{ padding: "8px 12px", opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>
            First
          </button>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={styles.button}
            style={{ padding: "8px 12px", opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>
            Previous
          </button>

          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {(() => {
              const pages = [];
              const maxPagesToShow = 7;
              let startPage = Math.max(1, currentPage - 3);
              let endPage   = Math.min(totalPages, startPage + maxPagesToShow - 1);
              if (endPage - startPage < maxPagesToShow - 1) startPage = Math.max(1, endPage - maxPagesToShow + 1);

              if (startPage > 1) {
                pages.push(<button key={1} onClick={() => goToPage(1)} className={styles.button} style={{ padding: "8px 12px", minWidth: "40px", background: "#e2e8f0" }}>1</button>);
                if (startPage > 2) pages.push(<span key="e1" style={{ padding: "0 5px" }}>…</span>);
              }
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button key={i} onClick={() => goToPage(i)} className={styles.button}
                    style={{ padding: "8px 12px", minWidth: "40px", background: currentPage === i ? "#4299e1" : "#e2e8f0", color: currentPage === i ? "white" : "black", fontWeight: currentPage === i ? "bold" : "normal" }}>
                    {i}
                  </button>
                );
              }
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) pages.push(<span key="e2" style={{ padding: "0 5px" }}>…</span>);
                pages.push(<button key={totalPages} onClick={() => goToPage(totalPages)} className={styles.button} style={{ padding: "8px 12px", minWidth: "40px", background: "#e2e8f0" }}>{totalPages}</button>);
              }
              return pages;
            })()}
          </div>

          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={styles.button}
            style={{ padding: "8px 12px", opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}>
            Next
          </button>
          <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className={styles.button}
            style={{ padding: "8px 12px", opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}>
            Last
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "10px" }}>
            <span style={{ fontSize: "14px" }}>Go to:</span>
            <input
              type="number" min="1" max={totalPages} value={currentPage}
              onChange={(e) => { const p = parseInt(e.target.value); if (p >= 1 && p <= totalPages) goToPage(p); }}
              className={styles.input}
              style={{ width: "70px", padding: "6px", textAlign: "center" }}
            />
            <span style={{ fontSize: "14px", color: "#666" }}>of {totalPages}</span>
          </div>
        </div>
      )}
    </div>
  );
}
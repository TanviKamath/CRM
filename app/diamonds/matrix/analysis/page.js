// app/diamonds/matrix/analysis/page.js
"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { calculateMatrixData } from "../../../lib/utils/matrixUtils";

const C = {
  blue: "#0071e3", green: "#34c759", orange: "#ff9f0a", red: "#ff3b30",
  bg: "#f5f5f7", text: "#1d1d1f", sub: "#86868b", light: "#f2f2f7", border: "#e5e5ea",
};

function fmt(v) {
  const n = parseFloat(v) || 0;
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + "Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetColor = searchParams.get("color");
  const targetSize = searchParams.get("size");

  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGrade, setExpandedGrade] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/loose-diamonds/items");
        const data = await res.json();
        setDiamonds(Array.isArray(data) ? data : []);
      } catch {
        setDiamonds([]);
      }
      setLoading(false);
    })();
  }, []);

  const matrixData = useMemo(() => calculateMatrixData(diamonds), [diamonds]);

  const selectedData = useMemo(() => {
    if (!matrixData || !targetColor || !targetSize) return null;
    return matrixData.grid[targetColor]?.[targetSize];
  }, [matrixData, targetColor, targetSize]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: C.sub, fontFamily: "Inter, sans-serif" }}>
        <i className="bi bi-arrow-repeat spin" style={{ fontSize: "2rem", display: "block", marginBottom: 12 }} />
        Loading analysis...
      </div>
    );
  }

  if (!selectedData || selectedData.carats === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: C.sub, fontFamily: "Inter, sans-serif" }}>
        <h2 style={{ color: C.text }}>No data found</h2>
        <p>Could not find inventory for {targetSize} | {targetColor}</p>
        <Link href="/diamonds" style={{ color: C.blue, fontWeight: 600 }}>Back to Inventory</Link>
      </div>
    );
  }

  const grades = Object.entries(selectedData.grades).sort(([a], [b]) => a.localeCompare(b));
  const activeGradeId = expandedGrade || grades[0]?.[0];
  const activeData = selectedData.grades[activeGradeId];

  return (
    <div style={{ 
      fontFamily: "Inter, -apple-system, sans-serif", 
      background: C.bg, minHeight: "100vh", padding: "20px" 
    }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />
      
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Breadcrumb / Back */}
        <div style={{ marginBottom: 16 }}>
          <Link 
            href="/diamonds" 
            style={{ 
              display: "inline-flex", alignItems: "center", gap: 8, 
              color: C.sub, textDecoration: "none", fontSize: "0.85rem", fontWeight: 500 
            }}
          >
            <i className="bi bi-arrow-left" /> Back to Inventory
          </Link>
        </div>

        {/* Header */}
        <div style={{ 
          background: "#fff", borderRadius: "16px", padding: "16px 24px", 
          border: `1px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: "12px", background: C.blue, 
              display: "flex", alignItems: "center", justifyContent: "center" 
            }}>
              <i className="bi bi-bar-chart-fill" style={{ color: "#fff", fontSize: "1.2rem" }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
                Inventory Analysis
              </h1>
              <p style={{ margin: "1px 0 0", fontSize: "0.85rem", color: C.sub }}>
                Breakdown for <b style={{ color: C.blue }}>{targetSize} | {targetColor}</b>
              </p>
            </div>
          </div>
          
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.7rem", color: C.sub, fontWeight: 700, textTransform: "uppercase" }}>Total for Category</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: C.text }}>{selectedData.carats.toFixed(3)} <span style={{ fontSize: "0.85rem", color: C.sub }}>ct</span></div>
          </div>
        </div>

        {/* Grade Scroller */}
        <div style={{ 
          display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 6 
        }}>
          {grades.map(([grade, data]) => (
            <button 
              key={grade}
              onClick={() => setExpandedGrade(grade)}
              style={{ 
                padding: "8px 16px", borderRadius: "10px", cursor: "pointer",
                background: activeGradeId === grade ? C.blue : "#fff",
                color: activeGradeId === grade ? "#fff" : C.text,
                border: `1px solid ${activeGradeId === grade ? C.blue : C.border}`,
                transition: "all 0.2s", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: activeGradeId === grade ? "0 4px 10px rgba(0,113,227,0.15)" : "none",
                outline: "none"
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{grade}</span>
              <span style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: 600 }}>{data.carats.toFixed(2)} ct</span>
            </button>
          ))}
        </div>

        {/* Analysis Body */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px" }}>
          {/* Summary Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ 
              background: "rgba(0,113,227,0.03)", padding: "16px", borderRadius: "16px", 
              border: `1px solid rgba(0,113,227,0.1)` 
            }}>
              <div style={{ fontSize: "0.7rem", color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Active Grade</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: C.text, lineHeight: 1 }}>{activeGradeId}</div>
              <div style={{ fontSize: "0.85rem", color: C.blue, fontWeight: 600, marginTop: 4 }}>Selected for detailed breakdown</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#fff", padding: "12px 16px", borderRadius: "16px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "0.65rem", color: C.sub, fontWeight: 700, marginBottom: 2 }}>TOTAL CARATS</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: C.text }}>{activeData.carats.toFixed(3)}</div>
              </div>
              
              <div style={{ background: "#fff", padding: "12px 16px", borderRadius: "16px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "0.65rem", color: C.sub, fontWeight: 700, marginBottom: 2 }}>LOT COUNT</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: C.text }}>{activeData.count}</div>
              </div>
            </div>

            <div style={{ 
              background: "linear-gradient(135deg, #fff 0%, #f9f9f9 100%)", 
              padding: "16px", borderRadius: "16px", border: `1px solid ${C.border}` 
            }}>
              <div style={{ fontSize: "0.65rem", color: C.sub, fontWeight: 700, marginBottom: 4 }}>ESTIMATED AVG RATE</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: C.green }}>
                {fmt(activeData.totalPrice / activeData.carats)} 
                <span style={{ fontSize: "0.85rem", color: C.sub, fontWeight: 500 }}> / ct</span>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div style={{ 
            background: "#fff", border: `1px solid ${C.border}`, borderRadius: "16px", 
            padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            display: "flex", flexDirection: "column" 
          }}>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
                <i className="bi bi-list-ul" style={{ color: C.blue }} /> Lot Breakdown
              </h3>
              <span style={{ fontSize: "0.75rem", color: C.sub, fontWeight: 500 }}>{activeData.items.length} lots found</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                <thead>
                  <tr style={{ color: C.sub, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "0 10px 8px", textAlign: "left", fontWeight: 700 }}>Lot #</th>
                    <th style={{ padding: "0 10px 8px", textAlign: "right", fontWeight: 700 }}>Weight</th>
                    <th style={{ padding: "0 10px 8px", textAlign: "right", fontWeight: 700 }}>Rate</th>
                    <th style={{ padding: "0 10px 8px", textAlign: "right", fontWeight: 700 }}>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {activeData.items.map((item, idx) => (
                    <tr key={idx} style={{ background: "#fcfcfc", borderRadius: "8px" }}>
                      <td style={{ padding: "10px", fontWeight: 700, color: C.text, borderRadius: "8px 0 0 8px", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}` }}>
                        {item.lot_number}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", color: C.text, fontWeight: 600, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                        {parseFloat(item.carats).toFixed(3)} ct
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", color: C.green, fontWeight: 700, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                        {fmt(parseFloat(item.total_value) / parseFloat(item.carats))}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", color: C.text, fontWeight: 800, borderRadius: "0 8px 8px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>
                        {fmt(item.total_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        button:hover { filter: brightness(0.95); }
      `}</style>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px' }}>Loading...</div>}>
      <AnalysisContent />
    </Suspense>
  );
}

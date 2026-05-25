// app/page.js
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageSkeleton from "./components/PageSkeleton";

/* ═══════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════ */
const C = {
  blue: "#0071e3",
  green: "#34c759",
  orange: "#ff9f0a",
  red: "#ff3b30",
  purple: "#af52de",
  teal: "#5ac8fa",
  pink: "#ff2d55",
  indigo: "#5856d6",
  bg: "#f5f5f7",
  card: "#ffffff",
  text: "#1d1d1f",
  sub: "#86868b",
  border: "#e5e5ea",
  light: "#f2f2f7",
};
const DONUT = ["#0071e3", "#34c759", "#ff9f0a", "#af52de", "#ff3b30", "#5ac8fa", "#ff2d55", "#5856d6"];

/* ═══════════════════════════════════════════
   GLOBAL STYLES (injected once)
   ═══════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.dash{font-family:'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;
  background:${C.bg};min-height:100vh;-webkit-font-smoothing:antialiased}

.mc{background:#fff;border-radius:20px;padding:28px 24px;border:none;position:relative;overflow:hidden;
  box-shadow:0 1px 3px rgba(0,0,0,.04),0 1px 2px rgba(0,0,0,.06);
  transition:all .4s cubic-bezier(.25,.46,.45,.94)}
.mc:hover{box-shadow:0 12px 40px rgba(0,0,0,.08);transform:translateY(-4px)}
.mc::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:20px 20px 0 0}
.mc.bl::before{background:linear-gradient(90deg,#0071e3,#5ac8fa)}
.mc.gr::before{background:linear-gradient(90deg,#34c759,#30d158)}
.mc.or::before{background:linear-gradient(90deg,#ff9f0a,#ffcc02)}
.mc.pu::before{background:linear-gradient(90deg,#af52de,#bf5af2)}
.mc.rd::before{background:linear-gradient(90deg,#ff3b30,#ff6961)}
.mc.tl::before{background:linear-gradient(90deg,#5ac8fa,#64d2ff)}
.mc.pk::before{background:linear-gradient(90deg,#ff2d55,#ff6482)}
.mc.id::before{background:linear-gradient(90deg,#5856d6,#7c7aff)}

.sec-card{background:#fff;border-radius:20px;border:none;
  box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden}

.sec-head{padding:20px 24px 0;display:flex;justify-content:space-between;align-items:center}
.sec-body{padding:20px 24px 24px}

.sec-title{font-size:1.05rem;font-weight:700;color:${C.text};letter-spacing:-.02em;display:flex;align-items:center;gap:8px}
.sec-link{font-size:.78rem;font-weight:600;color:${C.blue};text-decoration:none;
  display:flex;align-items:center;gap:4px;transition:opacity .2s}
.sec-link:hover{opacity:.7;color:${C.blue}}

.lbl{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:${C.sub};margin-bottom:6px}
.val{font-size:2rem;font-weight:700;letter-spacing:-.03em;line-height:1.1;color:${C.text}}
.val-sm{font-size:1.35rem;font-weight:700;letter-spacing:-.02em;color:${C.text}}

.badge-up{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:100px;
  font-size:.68rem;font-weight:600;background:rgba(52,199,89,.12);color:#34c759}
.badge-dn{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:100px;
  font-size:.68rem;font-weight:600;background:rgba(255,59,48,.12);color:#ff3b30}
.badge-nt{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:100px;
  font-size:.68rem;font-weight:600;background:rgba(134,134,139,.12);color:#86868b}

.skel{background:linear-gradient(90deg,#f0f0f2 25%,#e8e8ed 50%,#f0f0f2 75%);
  background-size:200% 100%;border-radius:8px;display:inline-block;
  animation:skel 1.5s infinite}
@keyframes skel{0%{background-position:200% 0}100%{background-position:-200% 0}}

.fi{animation:fi .6s cubic-bezier(.25,.46,.45,.94) forwards;opacity:0}
.fi1{animation-delay:.05s}.fi2{animation-delay:.1s}.fi3{animation-delay:.15s}
.fi4{animation-delay:.2s}.fi5{animation-delay:.25s}.fi6{animation-delay:.3s}
.fi7{animation-delay:.35s}.fi8{animation-delay:.4s}
@keyframes fi{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

.qa{background:#fff;border-radius:16px;padding:22px 16px;text-align:center;
  text-decoration:none;color:inherit;transition:all .3s cubic-bezier(.25,.46,.45,.94);
  border:1px solid ${C.light};display:block}
.qa:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,.08);color:inherit;border-color:transparent}

.cr{display:flex;align-items:center;padding:12px 0;border-bottom:1px solid ${C.light};transition:background .2s}
.cr:last-child{border-bottom:none}

.ap{padding:12px 16px;border-radius:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px}

.bar-seg{transition:all .3s;cursor:pointer;border-radius:8px 8px 3px 3px}
.bar-seg:hover{filter:brightness(1.08);transform:scaleY(1.04)}

.ptrack{height:6px;border-radius:3px;background:${C.light};overflow:hidden}
.pfill{height:100%;border-radius:3px;transition:width .8s cubic-bezier(.25,.46,.45,.94)}

.noscroll::-webkit-scrollbar{display:none}
.noscroll{-ms-overflow-style:none;scrollbar-width:none}

@media(max-width:991px){.val{font-size:1.5rem}}
@media(max-width:767px){.mc{padding:20px 18px}.val{font-size:1.3rem}}
`;

/* ═══════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════ */
function fmt(v, cur = "INR") {
  const n = parseFloat(v) || 0;
  if (cur === "INR") {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
    if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "K";
    return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtNum(v) {
  return (parseFloat(v) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

function Skel({ w = "100%", h = 20 }) {
  return <div className="skel" style={{ width: w, height: h }} />;
}

function KPI({ label, value, sub, trend, icon, accent, cls, loading }) {
  const ac = C[accent] || C.blue;
  return (
    <div className={`mc ${cls}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span className="lbl">{label}</span>
        <div
          style={{
            width: 38, height: 38, borderRadius: 12,
            background: `${ac}12`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", color: ac,
          }}
        >
          <i className={`bi ${icon}`} />
        </div>
      </div>
      {loading ? (
        <>
          <Skel w={120} h={30} />
          <div style={{ marginTop: 8 }}><Skel w={80} h={16} /></div>
        </>
      ) : (
        <>
          <div className="val">{value}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {trend !== undefined && trend !== null && (
              <span className={trend >= 0 ? "badge-up" : trend < 0 ? "badge-dn" : "badge-nt"}>
                <i className={`bi ${trend > 0 ? "bi-arrow-up-right" : trend < 0 ? "bi-arrow-down-right" : "bi-dash"}`} style={{ fontSize: ".6rem" }} />
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {sub && <span style={{ fontSize: ".73rem", color: C.sub }}>{sub}</span>}
          </div>
        </>
      )}
    </div>
  );
}

function Donut({ data, size = 170, ring = 22, centerVal, centerLbl }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total)
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: C.light, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: C.sub, fontSize: ".8rem" }}>No data</span>
      </div>
    );
  let angle = 0;
  const segs = data.map((d, i) => {
    const a = (d.value / total) * 360;
    const s = `${DONUT[i % DONUT.length]} ${angle}deg ${angle + a}deg`;
    angle += a;
    return s;
  });
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${segs.join(",")})`, position: "relative", margin: "0 auto" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: size - ring * 2, height: size - ring * 2, borderRadius: "50%", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 700, color: C.text, lineHeight: 1 }}>{centerVal ?? total}</div>
        <div style={{ fontSize: ".62rem", color: C.sub, marginTop: 3 }}>{centerLbl || "Total"}</div>
      </div>
    </div>
  );
}

function Legend({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: DONUT[i % DONUT.length], flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: ".78rem", color: C.sub, textTransform: "capitalize" }}>{d.label}</span>
          <span style={{ fontSize: ".78rem", fontWeight: 600, color: C.text }}>{d.value}</span>
          <span style={{ fontSize: ".68rem", color: C.sub, minWidth: 32, textAlign: "right" }}>{pct(d.value, total)}%</span>
        </div>
      ))}
    </div>
  );
}

function Bars({ data, h = 150 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: h, paddingTop: 22 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {d.value > 0 && (
            <span style={{ fontSize: ".58rem", fontWeight: 600, color: C.text, marginBottom: 4, whiteSpace: "nowrap" }}>
              {fmt(d.value)}
            </span>
          )}
          <div
            className="bar-seg"
            style={{
              width: "100%", maxWidth: 38,
              height: `${Math.max(4, (d.value / max) * (h - 50))}px`,
              background: d.hl ? `linear-gradient(180deg,${C.blue},${C.teal})` : `linear-gradient(180deg,${C.blue}35,${C.blue}12)`,
            }}
          />
          <span style={{ fontSize: ".62rem", color: d.hl ? C.text : C.sub, fontWeight: d.hl ? 600 : 400, marginTop: 6 }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Ring({ pct: p = 0, size = 52, sw = 5, color = C.blue }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(100, Math.max(0, p)) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.light} strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  );
}

function PBar({ value = 0, max = 100, color = C.blue, label, sub }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: ".78rem", fontWeight: 500, color: C.text }}>{label}</span>
        <span style={{ fontSize: ".72rem", fontWeight: 600, color: C.sub }}>{sub || `${Math.round(w)}%`}</span>
      </div>
      <div className="ptrack">
        <div className="pfill" style={{ width: `${w}%`, background: `linear-gradient(90deg,${color},${color}aa)` }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════ */
export default function HomePage() {
  const [user, setUser] = useState(null);
  const [diamonds, setDiamonds] = useState([]);
  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [salePayments, setSalePayments] = useState([]);
  const [purchasePayments, setPurchasePayments] = useState([]);
  const [looseLots, setLooseLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const safeFetch = async (url) => {
        try {
          const r = await fetch(url);
          if (!r.ok) return [];
          const d = await r.json();
          return Array.isArray(d) ? d : d.data || [];
        } catch {
          return [];
        }
      };
      const diamondEndpoint = user?.client_type?.toLowerCase() === "loose" ? "/api/loose-diamonds/items" : "/api/diamonds";
      const lotsEndpoint = user?.client_type?.toLowerCase() === "loose" ? "/api/loose-diamonds" : null;
      const [di, cl, br, sa, ex, sp, pp, lo] = await Promise.all([
        safeFetch(diamondEndpoint),
        safeFetch("/api/clients"),
        safeFetch("/api/brokers"),
        safeFetch("/api/sales"),
        safeFetch("/api/expenses"),
        safeFetch("/api/sale-payments"),
        safeFetch("/api/payment-outstanding"),
        lotsEndpoint ? safeFetch(lotsEndpoint) : Promise.resolve([]),
      ]);
      setDiamonds(di);
      setClients(cl);
      setBrokers(br);
      setSales(sa);
      setExpenses(ex);
      setSalePayments(sp);
      setPurchasePayments(pp);
      setLooseLots(lo);
      setLoading(false);
    })();
  }, [user]);

  /* ══════════════════════════════════════════
     COMPUTED METRICS
     ══════════════════════════════════════════ */
  const m = useMemo(() => {
    const isLoose = user?.client_type?.toLowerCase() === "loose";
    const avail = isLoose
      ? diamonds.filter((d) => (parseFloat(d.carats) || 0) > 0)
      : diamonds.filter((d) => d.availability === "available");
    const memo = isLoose
      ? diamonds.filter((d) => (parseFloat(d.total_on_memo_carats) || 0) > 0)
      : diamonds.filter((d) => d.availability === "memo");
    const sold = isLoose ? [] : diamonds.filter((d) => d.availability === "sold");
    const sts = isLoose ? [] : diamonds.filter((d) => d.availability === "subject_to_sale");

    const stockVal = isLoose
      ? avail.reduce((s, d) => s + ((parseFloat(d.final_price_per_carat) || 0) * (parseFloat(d.carats) || 0)), 0)
      : avail.reduce((s, d) => s + (parseFloat(d.amount_inr || d.amount_usd) || 0), 0);

    const stockCost = isLoose
      ? avail.reduce((s, d) => s + ((parseFloat(d.final_price_per_carat) || 0) * (parseFloat(d.carats) || 0)), 0)
      : avail.reduce((s, d) => s + (parseFloat(d.purchase_price_inr || d.purchase_price) || 0), 0);

    const stockValINR = stockVal;
    const potential = stockVal - stockCost;
    const totalCt = avail.reduce((s, d) => s + (parseFloat(isLoose ? d.carats : d.weight) || 0), 0);
    const avgPPC = totalCt > 0 ? stockVal / totalCt : 0;

    const revUSD = sales.reduce((s, x) => s + (parseFloat(x.sale_amount) || 0), 0);
    const revINR = sales.reduce((s, x) => s + (parseFloat(x.sale_amount_inr) || 0), 0);

    let costOfSold = 0;
    sales.forEach((sl) => {
      if (isLoose) {
        const item = diamonds.find((x) => x.id === sl.loose_diamond_item_id);
        if (item) {
          const soldCarats = parseFloat(sl.loose_item?.carats || sl.loose_carats || 0);
          costOfSold += (parseFloat(item.final_price_per_carat) || 0) * soldCarats;
        }
      } else {
        const d = diamonds.find((x) => x.id === sl.diamond_id);
        if (d) costOfSold += parseFloat(d.purchase_price_inr || d.purchase_price) || 0;
      }
    });
    const grossProfit = revINR - costOfSold;
    const margin = revINR > 0 ? (grossProfit / revINR) * 100 : 0;

    const brokTotal = sales.reduce((s, x) => s + (parseFloat(x.brokerage_amount) || 0), 0);

    const totalSaleINR = sales.reduce((s, x) => s + (parseFloat(x.sale_amount_inr) || 0), 0);
    const totalAdv = sales.reduce((s, x) => s + (parseFloat(x.advance_amount) || 0), 0);
    const totalSpDone = salePayments.reduce((s, x) => s + (parseFloat(x.payment_amount_done) || 0), 0);
    const receivables = Math.max(0, totalSaleINR - totalAdv - totalSpDone);

    const payables = isLoose
      ? looseLots.reduce((sum, lot) => sum + Math.max(0, (parseFloat(lot.total_purchase_value) || 0) - (parseFloat(lot.total_paid) || 0)), 0)
      : (() => {
          const onTerms = diamonds.filter((d) => d.payment_status === "On Terms");
          const totalPurINR = onTerms.reduce((s, d) => s + (parseFloat(d.purchase_price_inr) || 0), 0);
          const totalPpDone = purchasePayments.reduce((s, x) => s + (parseFloat(x.payment_amount_done) || 0), 0);
          return Math.max(0, totalPurINR - totalPpDone);
        })();

    const collectRate = totalSaleINR > 0 ? ((totalAdv + totalSpDone) / totalSaleINR) * 100 : 100;

    const now = new Date();
    const thisMo = now.getMonth();
    const thisYr = now.getFullYear();
    const lastMo = thisMo === 0 ? 11 : thisMo - 1;
    const lastYr = thisMo === 0 ? thisYr - 1 : thisYr;

    const thisMonthSales = sales.filter((s) => {
      const d = new Date(s.selling_date || s.created_at);
      return d.getMonth() === thisMo && d.getFullYear() === thisYr;
    });
    const lastMonthSales = sales.filter((s) => {
      const d = new Date(s.selling_date || s.created_at);
      return d.getMonth() === lastMo && d.getFullYear() === lastYr;
    });
    const thisMoRev = thisMonthSales.reduce((s, x) => s + (parseFloat(x.sale_amount) || 0), 0);
    const lastMoRev = lastMonthSales.reduce((s, x) => s + (parseFloat(x.sale_amount) || 0), 0);
    const revGrowth = lastMoRev > 0 ? ((thisMoRev - lastMoRev) / lastMoRev) * 100 : thisMoRev > 0 ? 100 : 0;

    const barData = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(thisYr, thisMo - i, 1);
      const mo = dt.getMonth();
      const yr = dt.getFullYear();
      const msales = sales.filter((s) => {
        const sd = new Date(s.selling_date || s.created_at);
        return sd.getMonth() === mo && sd.getFullYear() === yr;
      });
      barData.push({
        label: dt.toLocaleString("default", { month: "short" }),
        value: msales.reduce((s, x) => s + (parseFloat(x.sale_amount) || 0), 0),
        count: msales.length,
        hl: i === 0,
      });
    }

    const shapeCnt = {};
    avail.forEach((d) => {
      const sh = isLoose ? capitalize(d.color_category || "Other") : capitalize(d.shape || "Other");
      shapeCnt[sh] = (shapeCnt[sh] || 0) + 1;
    });
    const byShape = Object.entries(shapeCnt)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const byAvail = [
      { label: "Available", value: avail.length, color: C.green },
      { label: "On Memo", value: memo.length, color: C.orange },
      { label: "Subject to Sale", value: sts.length, color: C.teal },
      { label: "Sold", value: sold.length, color: C.blue },
    ].filter((x) => x.value > 0);

    const clRev = {};
    sales.forEach((s) => {
      if (!clRev[s.client_id]) clRev[s.client_id] = { total: 0, totalINR: 0, cnt: 0 };
      clRev[s.client_id].total += parseFloat(s.sale_amount) || 0;
      clRev[s.client_id].totalINR += parseFloat(s.sale_amount_inr) || 0;
      clRev[s.client_id].cnt += 1;
    });
    const topClients = Object.entries(clRev)
      .map(([id, d]) => {
        const cl = clients.find((c) => c.id === parseInt(id));
        return { id, name: cl?.company_name || cl?.contact_name || "Unknown", ...d };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const dueAlerts = sales
      .filter((s) => s.due_date && s.payment_status !== "paid")
      .map((s) => {
        const cl = clients.find((c) => c.id === s.client_id);
        const due = new Date(s.due_date);
        const days = Math.ceil((due - now) / 864e5);
        return { id: s.id, client: cl?.company_name || "Unknown", amount: parseFloat(s.sale_amount_inr) || 0, dueDate: s.due_date, days, overdue: days < 0, status: s.payment_status };
      })
      .sort((a, b) => a.days - b.days);

    const totalExp = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const expByCat = {};
    expenses.forEach((e) => {
      const cat = capitalize(e.category || "Other");
      expByCat[cat] = (expByCat[cat] || 0) + (parseFloat(e.amount) || 0);
    });
    const expenseData = Object.entries(expByCat)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const avgDisc = sales.length > 0 ? sales.reduce((s, x) => s + (parseFloat(x.sale_rap_discount) || 0), 0) / sales.length : 0;

    let avgDays = 0;
    if (isLoose) {
      const looseSales = sales.filter((s) => s.loose_diamond_item_id);
      if (looseSales.length) {
        const totalDays = looseSales.reduce((sum, sl) => {
          const item = diamonds.find((x) => x.id === sl.loose_diamond_item_id);
          if (item) {
            const buy = new Date(item.purchase_date || item.created_at);
            const sell = new Date(sl.selling_date || sl.created_at);
            return sum + Math.max(0, (sell - buy) / 864e5);
          }
          return sum;
        }, 0);
        avgDays = Math.round(totalDays / looseSales.length);
      }
    } else if (sold.length) {
      const totalDays = sold.reduce((sum, d) => {
        const sl = sales.find((s) => s.diamond_id === d.id);
        if (sl) {
          const buy = new Date(d.buying_date || d.created_at);
          const sell = new Date(sl.selling_date || sl.created_at);
          return sum + Math.max(0, (sell - buy) / 864e5);
        }
        return sum;
      }, 0);
      avgDays = Math.round(totalDays / sold.length);
    }

    const avgAge = avail.length
      ? Math.round(avail.reduce((s, d) => s + (now - new Date((isLoose ? d.purchase_date : d.buying_date) || d.created_at)) / 864e5, 0) / avail.length)
      : 0;

    const marginScore = Math.min(100, Math.max(0, margin * 3));
    const collectScore = Math.min(100, collectRate);
    const turnoverScore = avgDays > 0 ? Math.min(100, Math.max(0, (90 - avgDays) * 2)) : 50;
    const diversityScore = Math.min(100, byShape.length * 20);
    const healthScore = Math.round((marginScore + collectScore + turnoverScore + diversityScore) / 4);

    return {
      totalDiamonds: diamonds.length, availCnt: avail.length, memoCnt: memo.length, soldCnt: sold.length, stsCnt: sts.length,
      totalClients: clients.length, totalBrokers: brokers.length, totalSales: sales.length,
      stockVal, stockCost, stockValINR, potential, totalCt, avgPPC, avgAge,
      revUSD, revINR, grossProfit, margin, thisMoRev, lastMoRev, revGrowth, thisMoCnt: thisMonthSales.length, avgDisc, avgDays, brokTotal,
      receivables, payables, collectRate, totalExp,
      barData, byShape, byAvail, topClients, dueAlerts, expenseData,
      healthScore,
    };
  }, [diamonds, sales, clients, brokers, expenses, salePayments, purchasePayments, looseLots, user]);

  const greet = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  };
  const todayStr = () =>
    new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (!mounted) {
    return <PageSkeleton />;
  }

  const pro = true; // Show all metrics regardless of subscription

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="dash">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />

      <div className="container-fluid" style={{ maxWidth: 1440, padding: "28px 20px" }}>
        {/* ─────── HEADER ─────── */}
        <div className="fi fi1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 700, color: C.text, letterSpacing: "-.03em", margin: 0 }}>
              {greet()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p style={{ fontSize: ".85rem", color: C.sub, margin: "4px 0 0" }}>
              {todayStr()} · Here&apos;s your business overview
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link 
              href={user?.client_type?.toLowerCase() === "loose" ? "/loose-diamonds/create" : "/diamonds/create"} 
              style={{ background: C.text, color: "#fff", padding: "10px 20px", borderRadius: 12, fontSize: ".82rem", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "opacity .2s" }}
            >
              <i className="bi bi-plus-lg" style={{ fontSize: ".75rem" }} /> {user?.client_type?.toLowerCase() === "loose" ? "Add Lot" : "New Diamond"}
            </Link>
            {pro && (
              <Link href="/sales/create" style={{ background: C.blue, color: "#fff", padding: "10px 20px", borderRadius: 12, fontSize: ".82rem", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "opacity .2s" }}>
                <i className="bi bi-receipt" style={{ fontSize: ".75rem" }} /> Record Sale
              </Link>
            )}
          </div>
        </div>

        {/* ─────── KPI CARDS ─────── */}
        <div className="row g-3 mb-4">
          <div className="col-xl-3 col-md-6 fi fi1">
            <KPI label="Inventory Value" value={fmt(m.stockVal)} sub={user?.client_type?.toLowerCase() === "loose" ? `${fmtNum(m.totalCt)} ct · ${m.availCnt} items` : `${fmtNum(m.totalCt)} ct · ${m.availCnt} stones`} icon="bi-gem" accent="blue" cls="bl" loading={loading} />
          </div>
          {pro ? (
            <>
              <div className="col-xl-3 col-md-6 fi fi2">
                <KPI label="Total Revenue (INR)" value={fmt(m.revINR)} sub={`${m.totalSales} transactions`} trend={m.revGrowth} icon="bi-graph-up-arrow" accent="green" cls="gr" loading={loading} />
              </div>
              <div className="col-xl-3 col-md-6 fi fi3">
                <KPI label="Receivables (INR)" value={fmt(m.receivables, "INR")} sub={`Collection rate ${m.collectRate.toFixed(0)}%`} icon="bi-wallet2" accent="orange" cls="or" loading={loading} />
              </div>
              <div className="col-xl-3 col-md-6 fi fi4">
                <KPI label="Gross Margin" value={`${m.margin.toFixed(1)}%`} sub={`Profit ${fmt(m.grossProfit)}`} trend={m.margin > 0 ? m.margin : -m.margin} icon="bi-pie-chart" accent="purple" cls="pu" loading={loading} />
              </div>
            </>
          ) : (
            <>
              <div className="col-xl-3 col-md-6 fi fi2">
                <KPI label="Available Stock" value={m.availCnt} sub={`${fmtNum(m.totalCt)} total carats`} icon="bi-check-circle" accent="green" cls="gr" loading={loading} />
              </div>
              <div className="col-xl-3 col-md-6 fi fi3">
                <KPI label="On Memo" value={m.memoCnt} sub="Currently out" icon="bi-send" accent="orange" cls="or" loading={loading} />
              </div>
              <div className="col-xl-3 col-md-6 fi fi4">
                <KPI label="Avg ₹/Carat" value={fmt(m.avgPPC)} sub={`Across ${m.availCnt} ${user?.client_type?.toLowerCase() === "loose" ? "items" : "stones"}`} icon="bi-currency-rupee" accent="purple" cls="pu" loading={loading} />
              </div>
            </>
          )}
        </div>

        {/* ─────── SECONDARY KPIs (Pro) ─────── */}
        {pro && (
          <div className="row g-3 mb-4">
            {[
              { label: "Payables", value: fmt(m.payables, "INR"), icon: "bi-credit-card", cls: "rd", accent: "red" },
              { label: "Expenses", value: fmt(m.totalExp, "INR"), icon: "bi-cash-stack", cls: "pk", accent: "pink" },
              { label: "Avg Discount", value: `${m.avgDisc.toFixed(1)}%`, icon: "bi-percent", cls: "tl", accent: "teal" },
              { label: "Avg Days to Sell", value: `${m.avgDays}d`, icon: "bi-hourglass-split", cls: "id", accent: "indigo" },
              { label: "Brokerage Paid", value: fmt(m.brokTotal), icon: "bi-person-check", cls: "or", accent: "orange" },
              { label: "Potential Markup", value: fmt(m.potential), icon: "bi-arrow-up-circle", cls: "gr", accent: "green" },
            ].map((k, i) => (
              <div key={i} className={`col-xl-2 col-md-4 col-6 fi fi${i + 1}`}>
                <div className={`mc ${k.cls}`} style={{ padding: "20px 18px" }}>
                  <div className="lbl" style={{ fontSize: ".62rem" }}>{k.label}</div>
                  <div className="val-sm">{loading ? <Skel w={60} h={24} /> : k.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─────── MAIN CONTENT ─────── */}
        <div className="row g-3">
          {/* ──── LEFT COL ──── */}
          <div className="col-lg-8">
            {/* Revenue Trend (Pro) */}
            {pro && (
              <div className="sec-card mb-3 fi fi3">
                <div className="sec-head">
                  <div className="sec-title">
                    <i className="bi bi-bar-chart-line" style={{ color: C.blue }} /> Revenue Trend
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: ".75rem", color: C.sub }}>
                      This month: <strong style={{ color: C.text }}>{fmt(m.thisMoRev)}</strong>
                    </span>
                    <span className={m.revGrowth >= 0 ? "badge-up" : "badge-dn"}>
                      <i className={`bi ${m.revGrowth >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"}`} style={{ fontSize: ".6rem" }} />
                      {Math.abs(m.revGrowth).toFixed(1)}% vs last mo
                    </span>
                  </div>
                </div>
                <div className="sec-body">{loading ? <Skel h={160} /> : <Bars data={m.barData} />}</div>
              </div>
            )}

            {/* Stock Composition */}
            <div className="row g-3 mb-3">
              <div className="col-md-6 fi fi4">
                <div className="sec-card h-100">
                  <div className="sec-head">
                    <div className="sec-title">
                      <i className={user?.client_type?.toLowerCase() === "loose" ? "bi bi-palette" : "bi bi-diamond-half"} style={{ color: C.purple }} /> {user?.client_type?.toLowerCase() === "loose" ? "Stock by Color" : "Stock by Shape"}
                    </div>
                  </div>
                  <div className="sec-body">
                    {loading ? (
                      <Skel h={180} />
                    ) : (
                      <div className="row align-items-center">
                        <div className="col-6"><Donut data={m.byShape} centerVal={m.availCnt} centerLbl={user?.client_type?.toLowerCase() === "loose" ? "Items" : "Stones"} /></div>
                        <div className="col-6"><Legend data={m.byShape.slice(0, 6)} /></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-6 fi fi5">
                <div className="sec-card h-100">
                  <div className="sec-head">
                    <div className="sec-title">
                      <i className="bi bi-layers" style={{ color: C.green }} /> Availability
                    </div>
                    <Link href="/diamonds" className="sec-link">View all <i className="bi bi-chevron-right" style={{ fontSize: ".6rem" }} /></Link>
                  </div>
                  <div className="sec-body">
                    {loading ? (
                      <Skel h={180} />
                    ) : (
                      <>
                        {m.byAvail.map((item, i) => (
                          <PBar key={i} label={item.label} value={item.value} max={m.totalDiamonds} color={item.color} sub={user?.client_type?.toLowerCase() === "loose" ? `${item.value} items` : `${item.value} stones`} />
                        ))}
                        <div style={{ marginTop: 16, padding: "14px 16px", background: C.light, borderRadius: 14 }}>
                          <div className="row text-center">
                            <div className="col-4">
                              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: C.text }}>{fmtNum(m.totalCt)}</div>
                              <div style={{ fontSize: ".65rem", color: C.sub }}>Total Carats</div>
                            </div>
                            <div className="col-4">
                              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: C.text }}>{fmt(m.avgPPC)}</div>
                              <div style={{ fontSize: ".65rem", color: C.sub }}>Avg ₹/ct</div>
                            </div>
                            <div className="col-4">
                              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: C.text }}>{m.avgAge}d</div>
                              <div style={{ fontSize: ".65rem", color: C.sub }}>Avg Age</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Clients (Pro) */}
            {pro && (
              <div className="sec-card mb-3 fi fi5">
                <div className="sec-head">
                  <div className="sec-title">
                    <i className="bi bi-trophy" style={{ color: C.orange }} /> Top Clients
                  </div>
                  <Link href="/clients" className="sec-link">View all <i className="bi bi-chevron-right" style={{ fontSize: ".6rem" }} /></Link>
                </div>
                <div className="sec-body" style={{ padding: "12px 24px 24px" }}>
                  {loading ? (
                    [1, 2, 3].map((i) => <div key={i} style={{ padding: "12px 0" }}><Skel h={36} /></div>)
                  ) : m.topClients.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 32, color: C.sub }}>
                      <i className="bi bi-people" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />No sales yet
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", padding: "0 0 8px", borderBottom: `1px solid ${C.light}` }}>
                        <span style={{ flex: 1, fontSize: ".68rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em" }}>Client</span>
                        <span style={{ width: 80, fontSize: ".68rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em", textAlign: "center" }}>Sales</span>
                        <span style={{ width: 120, fontSize: ".68rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em", textAlign: "right" }}>Revenue</span>
                        <span style={{ width: 80, fontSize: ".68rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em", textAlign: "right" }}>Share</span>
                      </div>
                      {m.topClients.map((cl, i) => (
                        <div key={cl.id} className="cr">
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${DONUT[i]}18`, color: DONUT[i], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".78rem", marginRight: 12, flexShrink: 0 }}>
                            {cl.name.charAt(0)}
                          </div>
                          <span style={{ flex: 1, fontSize: ".82rem", fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cl.name}</span>
                          <span style={{ width: 80, fontSize: ".82rem", fontWeight: 600, color: C.text, textAlign: "center" }}>{cl.cnt}</span>
                          <span style={{ width: 120, fontSize: ".82rem", fontWeight: 600, color: C.text, textAlign: "right" }}>{fmt(cl.total)}</span>
                          <span style={{ width: 80, fontSize: ".78rem", color: C.sub, textAlign: "right" }}>{pct(cl.total, m.revUSD)}%</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Expense Breakdown (Pro) */}
            {pro && m.expenseData.length > 0 && (
              <div className="sec-card mb-3 fi fi6">
                <div className="sec-head">
                  <div className="sec-title">
                    <i className="bi bi-receipt-cutoff" style={{ color: C.pink }} /> Expense Breakdown
                  </div>
                  <span style={{ fontSize: ".78rem", fontWeight: 600, color: C.text }}>{fmt(m.totalExp, "INR")}</span>
                </div>
                <div className="sec-body">
                  <div className="row g-3">
                    {m.expenseData.map((e, i) => (
                      <div key={i} className="col-md-6">
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.light, borderRadius: 14 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${DONUT[i % DONUT.length]}15`, display: "flex", alignItems: "center", justifyContent: "center", color: DONUT[i % DONUT.length], fontSize: ".9rem", flexShrink: 0 }}>
                            <i className={`bi ${e.label.toLowerCase().includes("salary") || e.label.toLowerCase().includes("salaries") ? "bi-people" : e.label.toLowerCase().includes("broker") ? "bi-person-badge" : "bi-cash"}`} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: ".8rem", fontWeight: 600, color: C.text }}>{e.label}</div>
                            <div style={{ fontSize: ".7rem", color: C.sub }}>{pct(e.value, m.totalExp)}% of total</div>
                          </div>
                          <span style={{ fontSize: ".85rem", fontWeight: 700, color: C.text }}>{fmt(e.value, "INR")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ──── QUICK ACTIONS (moved here from right) ──── */}
            <div className="row g-3 mb-3">
              <div className="col-md-6 fi fi7">
                <div className="sec-card h-100">
                  <div className="sec-head">
                    <div className="sec-title">
                      <i className="bi bi-grid" style={{ color: C.sub }} /> Quick Actions
                    </div>
                  </div>
                  <div className="sec-body">
                    <div className="row g-2">
                      {[
                        { 
                          label: user?.client_type?.toLowerCase() === "loose" ? "Lot" : "Diamond", 
                          icon: "bi-gem", 
                          color: C.blue, 
                          href: user?.client_type?.toLowerCase() === "loose" ? "/loose-diamonds/create" : "/diamonds/create" 
                        },
                        { label: "Client", icon: "bi-person-plus", color: C.green, href: "/clients/create" },
                        { label: "Broker", icon: "bi-person-badge", color: C.orange, href: "/brokers/create" },
                        ...(pro ? [{ label: "Sale", icon: "bi-receipt", color: C.purple, href: "/sales/create" }] : []),
                      ].map((a, i) => (
                        <div key={i} className={pro ? "col-6" : "col-4"}>
                          <Link href={a.href} className="qa">
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${a.color}12`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 8, color: a.color, fontSize: "1.1rem" }}>
                              <i className={`bi ${a.icon}`} />
                            </div>
                            <div style={{ fontSize: ".75rem", fontWeight: 600, color: C.text }}>{a.label}</div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ──── NAVIGATION LINKS (moved here from right) ──── */}
              <div className="col-md-6 fi fi8">
                <div className="sec-card h-100">
                  <div className="sec-head">
                    <div className="sec-title">
                      <i className="bi bi-signpost-split" style={{ color: C.sub }} /> Navigate
                    </div>
                  </div>
                  <div className="sec-body" style={{ padding: "8px 0" }}>
                    {[
                      { label: user?.client_type?.toLowerCase() === "loose" ? "All Lot Items" : "All Diamonds", icon: "bi-gem", color: C.blue, count: m.totalDiamonds, href: "/diamonds" },
                      { label: "All Clients", icon: "bi-people", color: C.green, count: m.totalClients, href: "/clients" },
                      { label: "All Brokers", icon: "bi-person-badge", color: C.orange, count: m.totalBrokers, href: "/brokers" },
                      ...(pro ? [{ label: "All Sales", icon: "bi-graph-up-arrow", color: C.purple, count: m.totalSales, href: "/sales" }] : []),
                      ...(pro ? [{ label: "Expenses", icon: "bi-cash-stack", color: C.pink, count: expenses.length, href: "/expenses" }] : []),
                    ].map((item, i) => (
                      <Link
                        key={i}
                        href={item.href}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 24px", textDecoration: "none", color: "inherit",
                          borderBottom: `1px solid ${C.light}`, transition: "background .15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = C.light)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: "1rem" }} />
                        <span style={{ flex: 1, fontSize: ".82rem", fontWeight: 500, color: C.text }}>{item.label}</span>
                        <span style={{ fontSize: ".7rem", fontWeight: 600, padding: "2px 10px", borderRadius: 100, background: `${item.color}12`, color: item.color }}>{item.count}</span>
                        <i className="bi bi-chevron-right" style={{ fontSize: ".6rem", color: C.sub }} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ──── RIGHT COL ──── */}
          <div className="col-lg-4">
            {/* Business Health Score */}
            {pro && (
              <div className="sec-card mb-3 fi fi3">
                <div className="sec-body" style={{ textAlign: "center", padding: "28px 24px" }}>
                  <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                    <Ring pct={loading ? 0 : m.healthScore} size={100} sw={8} color={m.healthScore >= 70 ? C.green : m.healthScore >= 40 ? C.orange : C.red} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(0deg)", fontSize: "1.4rem", fontWeight: 700, color: C.text }}>
                      {loading ? "—" : m.healthScore}
                    </div>
                  </div>
                  <div style={{ fontSize: ".95rem", fontWeight: 700, color: C.text }}>Business Health</div>
                  <div style={{ fontSize: ".72rem", color: C.sub, marginTop: 2 }}>
                    {m.healthScore >= 70 ? "Excellent" : m.healthScore >= 50 ? "Good" : m.healthScore >= 30 ? "Needs Attention" : "Critical"}
                  </div>
                  <div className="row g-2 mt-3">
                    {[
                      { label: "Margin", val: `${m.margin.toFixed(0)}%`, color: m.margin > 10 ? C.green : C.orange },
                      { label: "Collection", val: `${m.collectRate.toFixed(0)}%`, color: m.collectRate > 60 ? C.green : C.orange },
                      { label: "Turnover", val: `${m.avgDays}d`, color: m.avgDays < 60 ? C.green : C.orange },
                    ].map((s, i) => (
                      <div key={i} className="col-4">
                        <div style={{ padding: "8px 4px", background: C.light, borderRadius: 10 }}>
                          <div style={{ fontSize: ".95rem", fontWeight: 700, color: s.color }}>{loading ? "—" : s.val}</div>
                          <div style={{ fontSize: ".58rem", color: C.sub }}>{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Alerts (Pro) */}
            {pro && m.dueAlerts.length > 0 && (
              <div className="sec-card mb-3 fi fi4">
                <div className="sec-head">
                  <div className="sec-title">
                    <i className="bi bi-bell" style={{ color: C.red }} /> Payment Alerts
                  </div>
                  <span style={{ fontSize: ".65rem", fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: `${C.red}15`, color: C.red }}>
                    {m.dueAlerts.filter((a) => a.overdue).length} overdue
                  </span>
                </div>
                <div className="sec-body noscroll" style={{ maxHeight: 280, overflowY: "auto" }}>
                  {m.dueAlerts.slice(0, 5).map((a, i) => (
                    <div key={i} className="ap" style={{ background: a.overdue ? `${C.red}08` : `${C.orange}08` }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: a.overdue ? `${C.red}15` : `${C.orange}15`, display: "flex", alignItems: "center", justifyContent: "center", color: a.overdue ? C.red : C.orange, fontSize: ".85rem", flexShrink: 0 }}>
                        <i className={`bi ${a.overdue ? "bi-exclamation-triangle" : "bi-clock"}`} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: ".78rem", fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          Sale #{a.id} · {a.client}
                        </div>
                        <div style={{ fontSize: ".68rem", color: C.sub }}>
                          {a.overdue ? `Overdue by ${Math.abs(a.days)}d` : `Due in ${a.days}d`} · {fmt(a.amount, "INR")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Position (Pro) */}
            {pro && (
              <div className="sec-card mb-3 fi fi4">
                <div className="sec-head">
                  <div className="sec-title">
                    <i className="bi bi-bank" style={{ color: C.indigo }} /> Financial Position
                  </div>
                </div>
                <div className="sec-body">
                  {[
                    { label: "Receivables", val: fmt(m.receivables, "INR"), icon: "bi-arrow-down-left", color: C.green, desc: "Money owed to you" },
                    { label: "Payables", val: fmt(m.payables, "INR"), icon: "bi-arrow-up-right", color: C.red, desc: "Money you owe" },
                    { label: "Net Position", val: fmt(m.receivables - m.payables, "INR"), icon: "bi-arrow-left-right", color: m.receivables >= m.payables ? C.green : C.red, desc: m.receivables >= m.payables ? "Positive" : "Negative" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 2 ? `1px solid ${C.light}` : "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, fontSize: ".9rem", flexShrink: 0 }}>
                        <i className={`bi ${item.icon}`} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: ".72rem", color: C.sub }}>{item.label}</div>
                        <div style={{ fontSize: ".95rem", fontWeight: 700, color: C.text }}>{loading ? <Skel w={60} h={18} /> : item.val}</div>
                      </div>
                      <span style={{ fontSize: ".65rem", color: item.color, fontWeight: 500 }}>{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sales (Pro) */}
            {pro && (
              <div className="sec-card mb-3 fi fi5">
                <div className="sec-head">
                  <div className="sec-title">
                    <i className="bi bi-clock-history" style={{ color: C.sub }} /> Recent Sales
                  </div>
                  <Link href="/sales" className="sec-link">View all <i className="bi bi-chevron-right" style={{ fontSize: ".6rem" }} /></Link>
                </div>
                <div className="sec-body noscroll" style={{ maxHeight: 300, overflowY: "auto" }}>
                  {loading ? (
                    [1, 2, 3].map((i) => <div key={i} style={{ marginBottom: 12 }}><Skel h={40} /></div>)
                  ) : sales.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 32, color: C.sub }}>
                      <i className="bi bi-inbox" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />No sales yet
                    </div>
                  ) : (
                    sales.slice(0, 6).map((sale) => {
                      const cl = clients.find((c) => c.id === sale.client_id);
                      return (
                        <div key={sale.id} className="cr">
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: sale.status === "completed" ? `${C.green}12` : `${C.orange}12`, display: "flex", alignItems: "center", justifyContent: "center", color: sale.status === "completed" ? C.green : C.orange, fontSize: ".8rem", marginRight: 10, flexShrink: 0 }}>
                            <i className={`bi ${sale.status === "completed" ? "bi-check-lg" : "bi-hourglass-split"}`} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: ".78rem", fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {cl?.company_name || "Client"} · #{sale.id}
                            </div>
                            <div style={{ fontSize: ".66rem", color: C.sub }}>
                              {new Date(sale.selling_date || sale.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </div>
                          </div>
                          <span style={{ fontSize: ".85rem", fontWeight: 700, color: C.text }}>{fmt(sale.sale_amount)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─────── FOOTER ─────── */}
        <div style={{ textAlign: "center", padding: "32px 0 8px", color: C.sub, fontSize: ".72rem" }}>
          <i className="bi bi-gem" style={{ marginRight: 4 }} /> Diamond Management System
        </div>
      </div>
    </div>
  );
}
// app/api/inventory/search/route.js
import knex from "../../../lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/services/authService";

// Fields that are hidden from unauthenticated callers
const PRICE_FIELDS = [
    "rap_rate",
    "rap_discount",
    "price_per_carat_usd",
    "amount_usd",
    "pur_rap_discount",
    "conversion_rate",
    "amount_inr",
    "purchase_from",
    "purchase_price",
    "purchase_conversion_rate",
    "purchase_price_inr",
];

/**
 * Parse size-range button labels like "0.30-0.39" or "10.00 Up"
 * into { min, max } pairs. max === null means unbounded upper limit.
 */
function parseSizeOption(opt) {
    if (!opt) return null;
    const upMatch = opt.match(/^([\d.]+)\s*Up$/i);
    if (upMatch) return { min: parseFloat(upMatch[1]), max: null };
    const rangeMatch = opt.match(/^([\d.]+)-([\d.]+)$/);
    if (rangeMatch)
        return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
    return null;
}

/**
 * POST /api/inventory/search
 *
 * Body (all fields optional):
 * {
 *   shapes:       string[],          // e.g. ["Round", "Oval"]
 *   sizeOptions:  string[],          // e.g. ["0.50-0.59", "1.00-1.49", "10.00 Up"]
 *   sizeFrom:     string | number,   // manual lower bound on weight
 *   sizeTo:       string | number,   // manual upper bound on weight
 *   color:        string[],          // e.g. ["D","E"] or ["Pink","Yellow"]
 *   colorType:    string[],          // ["White Color"] or ["Fancy Color"]
 *   clarity:      string[],          // e.g. ["VVS1","VS1"]
 *   cut:          string[],          // e.g. ["EX","VG"]
 *   polish:       string[],          // e.g. ["EX"]
 *   symmetry:     string[],          // e.g. ["EX","VG"]
 *   fluorescence: string[],          // e.g. ["None","Faint"]
 *   lab:          string[],          // e.g. ["GIA","IGI"]
 *   ha:           string[],          // e.g. ["EX"]
 *   bgm:          string[],          // ["YES"] | ["NO"] | []
 *   eyeClean:     string[],          // ["YES"] | ["NO"] | []
 *   location:     string[],          // e.g. ["India","USA"]
 *   refNo:        string,            // diamond_id or report_no substring search
 *   priceFrom:    string | number,   // lower bound on price_per_carat_usd
 *   priceTo:      string | number,   // upper bound on price_per_carat_usd
 *   backFrom:     string | number,   // lower bound on rap_discount
 *   backTo:       string | number,   // upper bound on rap_discount
 *   page:         number,            // default 1
 *   limit:        number,            // default 50, max 200
 * }
 *
 * Response:
 * { total: number, page: number, limit: number, data: Diamond[] }
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));

        const {
            shapes = [],
            sizeOptions = [],
            sizeFrom,
            sizeTo,
            color = [],
            colorType = ["White Color"],
            clarity = [],
            cut = [],
            polish = [],
            symmetry = [],
            fluorescence = [],
            lab = [],
            ha = [],
            bgm = [],
            eyeClean = [],
            location = [],
            refNo = "",
            priceFrom,
            priceTo,
            backFrom,
            backTo,
            page: rawPage = 1,
            limit: rawLimit = 50,
        } = body;

        // Validate pagination
        const page = Math.max(1, parseInt(rawPage) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(rawLimit) || 50));
        const offset = (page - 1) * limit;

        // Helper: ignore "All" toggle and empty arrays
        const activeValues = (arr) =>
            Array.isArray(arr) ? arr.filter((v) => v && v !== "All") : [];

        // Build base query
        const buildQuery = () => {
            let q = knex("diamonds").where("availability", "available");

            // ── Shape ────────────────────────────────────────────────────────────
            const activeShapes = activeValues(shapes);
            if (activeShapes.length > 0) {
                q = q.whereIn("shape", activeShapes);
            }

            // ── Size / Weight ─────────────────────────────────────────────────────
            const parsedSizeFrom = sizeFrom !== "" && sizeFrom != null ? parseFloat(sizeFrom) : null;
            const parsedSizeTo = sizeTo !== "" && sizeTo != null ? parseFloat(sizeTo) : null;

            if (sizeOptions.length > 0) {
                // Button-based range selection
                const ranges = sizeOptions.map(parseSizeOption).filter(Boolean);
                if (ranges.length > 0) {
                    q = q.where((builder) => {
                        ranges.forEach(({ min, max }) => {
                            if (max === null) {
                                builder.orWhere("weight", ">=", min);
                            } else {
                                builder.orWhereBetween("weight", [min, max]);
                            }
                        });
                    });
                }
            } else {
                // Manual input
                if (parsedSizeFrom !== null && !isNaN(parsedSizeFrom)) {
                    q = q.where("weight", ">=", parsedSizeFrom);
                }
                if (parsedSizeTo !== null && !isNaN(parsedSizeTo)) {
                    q = q.where("weight", "<=", parsedSizeTo);
                }
            }

            // ── Color ─────────────────────────────────────────────────────────────
            const activeColors = activeValues(color);
            if (activeColors.length > 0) {
                q = q.whereIn("color", activeColors);
            }

            // ── Clarity ───────────────────────────────────────────────────────────
            const activeClarities = activeValues(clarity);
            if (activeClarities.length > 0) {
                q = q.whereIn("clarity", activeClarities);
            }

            // ── Cut ───────────────────────────────────────────────────────────────
            const activeCut = activeValues(cut);
            if (activeCut.length > 0) {
                q = q.whereIn("cut", activeCut);
            }

            // ── Polish ────────────────────────────────────────────────────────────
            const activePolish = activeValues(polish);
            if (activePolish.length > 0) {
                q = q.whereIn("pol", activePolish);
            }

            // ── Symmetry ──────────────────────────────────────────────────────────
            const activeSymmetry = activeValues(symmetry);
            if (activeSymmetry.length > 0) {
                q = q.whereIn("sym", activeSymmetry);
            }

            // ── Fluorescence ──────────────────────────────────────────────────────
            const activeFluorescence = activeValues(fluorescence);
            if (activeFluorescence.length > 0) {
                q = q.whereIn("flor", activeFluorescence);
            }

            // ── Lab ───────────────────────────────────────────────────────────────
            const activeLabs = activeValues(lab);
            if (activeLabs.length > 0) {
                q = q.whereIn("lab", activeLabs);
            }

            // ── H&A (Hearts & Arrows – mapped to agsi_aset column) ───────────────
            const activeHa = activeValues(ha);
            if (activeHa.length > 0) {
                q = q.whereIn("agsi_aset", activeHa);
            }

            // ── BGM ───────────────────────────────────────────────────────────────
            // In DB: no_bgm = "Y" means NO BGM (no brown/green/milky)
            //                 "N" means BGM present
            // UI: "YES" = user wants stones WITHOUT bgm → no_bgm = "Y"
            //     "NO"  = user wants stones WITH bgm    → no_bgm = "N"
            if (bgm.length === 1) {
                const dbVal = bgm[0].toUpperCase() === "YES" ? "Y" : "N";
                q = q.where("no_bgm", dbVal);
            }

            // ── Eye Clean ─────────────────────────────────────────────────────────
            if (eyeClean.length === 1) {
                const dbVal = eyeClean[0].toUpperCase() === "YES" ? "Y" : "N";
                q = q.where("eye_clean", dbVal);
            }

            // ── Location ──────────────────────────────────────────────────────────
            const activeLocations = activeValues(location);
            if (activeLocations.length > 0) {
                q = q.whereIn("location", activeLocations);
            }

            // ── Ref No / Report No ───────────────────────────────────────────────
            const trimmedRef = (refNo || "").trim();
            if (trimmedRef) {
                q = q.where((builder) => {
                    builder
                        .where("diamond_id", "like", `%${trimmedRef}%`)
                        .orWhere("report_no", "like", `%${trimmedRef}%`);
                });
            }

            // ── Price / Carat ─────────────────────────────────────────────────────
            const parsedPriceFrom =
                priceFrom !== "" && priceFrom != null ? parseFloat(priceFrom) : null;
            const parsedPriceTo =
                priceTo !== "" && priceTo != null ? parseFloat(priceTo) : null;
            if (parsedPriceFrom !== null && !isNaN(parsedPriceFrom)) {
                q = q.where("price_per_carat_usd", ">=", parsedPriceFrom);
            }
            if (parsedPriceTo !== null && !isNaN(parsedPriceTo)) {
                q = q.where("price_per_carat_usd", "<=", parsedPriceTo);
            }

            // ── Back (%) / rap_discount ───────────────────────────────────────────
            const parsedBackFrom =
                backFrom !== "" && backFrom != null ? parseFloat(backFrom) : null;
            const parsedBackTo =
                backTo !== "" && backTo != null ? parseFloat(backTo) : null;
            if (parsedBackFrom !== null && !isNaN(parsedBackFrom)) {
                q = q.where("rap_discount", ">=", parsedBackFrom);
            }
            if (parsedBackTo !== null && !isNaN(parsedBackTo)) {
                q = q.where("rap_discount", "<=", parsedBackTo);
            }

            return q;
        };

        // Total count
        const [{ count }] = await buildQuery().count("* as count");
        const total = parseInt(count) || 0;

        // Paginated data
        const rows = await buildQuery()
            .select("*")
            .orderBy("id", "desc")
            .limit(limit)
            .offset(offset);

        // Auth check – strip price fields for unauthenticated callers
        const token = cookies().get("token")?.value;
        const isAuthenticated = !!(token && verifyToken(token));

        const data = isAuthenticated
            ? rows
            : rows.map((d) => {
                const clean = { ...d };
                PRICE_FIELDS.forEach((f) => delete clean[f]);
                return clean;
            });

        return new Response(
            JSON.stringify({ total, page, limit, data }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (e) {
        console.error("Inventory Search Error:", e);
        return new Response(
            JSON.stringify({ error: e.message || "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

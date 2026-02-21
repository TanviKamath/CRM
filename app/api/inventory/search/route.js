import { NextResponse } from 'next/server';
import knex from "../../../lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/services/authService";

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

function parseSizeOption(opt) {
    if (!opt) return null;
    const upMatch = opt.match(/^([\d.]+)\s*Up$/i);
    if (upMatch) return { min: parseFloat(upMatch[1]), max: null };
    const rangeMatch = opt.match(/^([\d.]+)-([\d.]+)$/);
    if (rangeMatch) return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
    return null;
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));

        // Exact names coming from handleSearch
        const {
            selectedShapes = [],
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
            sortField = "id",
            sortDir = "desc",
            availability,
        } = body;

        const page = Math.max(1, parseInt(rawPage) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(rawLimit) || 50));
        const offset = (page - 1) * limit;

        const allowedSortFields = [
            'id', 'diamond_id', 'location', 'lab', 'shape', 'weight',
            'color', 'clarity', 'cut', 'rap_rate', 'rap_discount',
            'price_per_carat_usd', 'amount_usd'
        ];
        const finalSortField = allowedSortFields.includes(sortField) ? sortField : 'id';
        const finalSortDir = sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc';

        const activeValues = (arr) =>
            Array.isArray(arr) ? arr.filter((v) => v && v !== "All") : [];

        const buildQuery = () => {
            let q = knex("diamonds");
            if (availability) {
                q = q.where("availability", availability);
            }

            // Shape
            const activeShapes = activeValues(selectedShapes);
            if (activeShapes.length > 0) {
                q = q.whereIn("shape", activeShapes);
            }

            // Size
            const parsedSizeFrom = sizeFrom ? parseFloat(sizeFrom) : null;
            const parsedSizeTo = sizeTo ? parseFloat(sizeTo) : null;

            if (sizeOptions.length > 0) {
                const ranges = sizeOptions.map(parseSizeOption).filter(Boolean);
                if (ranges.length > 0) {
                    q = q.where((builder) => {
                        ranges.forEach((r) => {
                            if (!r) return;
                            if (r.max === null) {
                                builder.orWhere("weight", ">=", r.min);
                            } else {
                                builder.orWhereBetween("weight", [r.min, r.max]);
                            }
                        });
                    });
                }
            } else {
                if (parsedSizeFrom !== null && !isNaN(parsedSizeFrom)) {
                    q = q.where("weight", ">=", parsedSizeFrom);
                }
                if (parsedSizeTo !== null && !isNaN(parsedSizeTo)) {
                    q = q.where("weight", "<=", parsedSizeTo);
                }
            }

            // Color
            const activeColors = activeValues(color);
            if (activeColors.length > 0) {
                q = q.whereIn("color", activeColors);
            }

            // Clarity
            const activeClarities = activeValues(clarity);
            if (activeClarities.length > 0) {
                q = q.whereIn("clarity", activeClarities);
            }

            // Cut
            const activeCut = activeValues(cut);
            if (activeCut.length > 0) {
                q = q.whereIn("cut", activeCut);
            }

            // Polish
            const activePolish = activeValues(polish);
            if (activePolish.length > 0) {
                q = q.whereIn("pol", activePolish);
            }

            // Symmetry
            const activeSymmetry = activeValues(symmetry);
            if (activeSymmetry.length > 0) {
                q = q.whereIn("sym", activeSymmetry);
            }

            // Fluorescence
            const activeFluorescence = activeValues(fluorescence);
            if (activeFluorescence.length > 0) {
                q = q.whereIn("flor", activeFluorescence);
            }

            // Lab
            const activeLabs = activeValues(lab);
            if (activeLabs.length > 0) {
                q = q.whereIn("lab", activeLabs);
            }

            // H&A mapped to agsi_aset
            const activeHa = activeValues(ha);
            if (activeHa.length > 0) {
                q = q.whereIn("agsi_aset", activeHa);
            }

            // BGM
            if (bgm.length === 1 && bgm[0] !== "All") {
                const dbVal = bgm[0].toUpperCase() === "YES" ? "Y" : "N";
                q = q.where("no_bgm", dbVal);
            }

            // Eye Clean
            if (eyeClean.length === 1 && eyeClean[0] !== "All") {
                const dbVal = eyeClean[0].toUpperCase() === "YES" ? "Y" : "N";
                q = q.where("eye_clean", dbVal);
            }

            // Location
            const activeLocations = activeValues(location);
            if (activeLocations.length > 0) {
                q = q.whereIn("location", activeLocations);
            }

            // Ref No
            const trimmedRef = (refNo || "").trim();
            if (trimmedRef) {
                q = q.where((builder) => {
                    builder
                        .where("diamond_id", "like", `%${trimmedRef}%`)
                        .orWhere("certificate_number", "like", `%${trimmedRef}%`)
                        .orWhere("report_no", "like", `%${trimmedRef}%`);
                });
            }

            // Price / Carat
            const parsedPriceFrom = priceFrom ? parseFloat(priceFrom) : null;
            const parsedPriceTo = priceTo ? parseFloat(priceTo) : null;
            if (parsedPriceFrom !== null && !isNaN(parsedPriceFrom)) {
                q = q.where("price_per_carat_usd", ">=", parsedPriceFrom);
            }
            if (parsedPriceTo !== null && !isNaN(parsedPriceTo)) {
                q = q.where("price_per_carat_usd", "<=", parsedPriceTo);
            }

            // Back / Rap Discount
            const parsedBackFrom = backFrom ? parseFloat(backFrom) : null;
            const parsedBackTo = backTo ? parseFloat(backTo) : null;
            if (parsedBackFrom !== null && !isNaN(parsedBackFrom)) {
                q = q.where("rap_discount", ">=", parsedBackFrom);
            }
            if (parsedBackTo !== null && !isNaN(parsedBackTo)) {
                q = q.where("rap_discount", "<=", parsedBackTo);
            }

            return q;
        };

        const [{ count }] = await buildQuery().count("* as count");
        const total = parseInt(count) || 0;

        const rows = await buildQuery()
            .select("*")
            .orderBy(finalSortField, finalSortDir)
            .limit(limit)
            .offset(offset);

        // Security check
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const isAuthenticated = !!(token && verifyToken(token));

        const data = isAuthenticated
            ? rows
            : rows.map((d) => {
                const clean = { ...d };
                PRICE_FIELDS.forEach((f) => delete clean[f]);
                return clean;
            });

        return NextResponse.json({ total, page, limit, data, isAuthenticated }, { status: 200 });
    } catch (e) {
        console.error("Inventory Search Error:", e);
        return NextResponse.json(
            { error: e.message || "Internal server error" },
            { status: 500 }
        );
    }
}

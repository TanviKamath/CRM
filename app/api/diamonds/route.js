// app/api/diamonds/route.js
import knex from "../../lib/db";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifyToken } from "../../lib/services/authService";

// Helper to convert empty strings to null
const emptyToNull = (v) => (v === "" || v === undefined ? null : v);

// Helper to convert to number or null
const toNumberOrNull = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const num = Number(v);
  return isNaN(num) ? null : num;
};

// Helper to convert to number or zero (for NOT NULL fields)
const toNumberOrZero = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
};

const diamondSchema = z.object({
  // Basic Information
  stone_type: z.string().optional().nullable(),
  lab: z.string().optional().nullable(),
  diamond_id: z.string().optional().nullable(),
  certificate_number: z.string().optional().nullable(),
  shape: z.string().min(1, "Shape is required"),
  weight: z.preprocess((v) => Number(v), z.number().positive("Weight must be positive")),
  color: z.string().min(1, "Color is required"),
  clarity: z.string().min(1, "Clarity is required"),
  cut: z.string().min(1, "Cut is required"),
  pol: z.string().optional().nullable(),
  sym: z.string().optional().nullable(),
  flor: z.string().optional().nullable(),
  eye_clean: z.string().optional().nullable(),
  no_bgm: z.string().optional().nullable(),

  // Report & Reference Information
  job_no: z.string().optional().nullable(),
  control_no: z.string().optional().nullable(),
  diamond_dossier: z.string().optional().nullable(),
  report_no: z.string().optional().nullable(),
  report_dt: z.string().optional().nullable(),
  client_ref: z.string().optional().nullable(),
  memo_no: z.string().optional().nullable(),

  // Quality Characteristics
  color_descriptions: z.string().optional().nullable(),
  clarity_status: z.string().optional().nullable(),
  final_cut: z.string().optional().nullable(),
  fluorescence_intensity: z.string().optional().nullable(),
  fluorescence_color: z.string().optional().nullable(),

  // Origin & Source Information
  country_of_origin: z.string().optional().nullable(),
  rough_report_number: z.string().optional().nullable(),
  diamond_type: z.string().optional().nullable(),
  disclosed_source: z.string().optional().nullable(),
  kimberley_process_number: z.string().optional().nullable(),
  rough_invoice_number: z.string().optional().nullable(),

  // Price Information - REQUIRED (NOT NULL in DB)
  rap_rate: z.preprocess((v) => toNumberOrZero(v), z.number()),
  rap_discount: z.preprocess((v) => toNumberOrZero(v), z.number()),
  price_per_carat_usd: z.preprocess((v) => toNumberOrZero(v), z.number()),
  amount_usd: z.preprocess((v) => toNumberOrZero(v), z.number()),
  pur_rap_discount: z.preprocess((v) => toNumberOrZero(v), z.number()),

  // Price Information - NULLABLE
  conversion_rate: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  amount_inr: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  purchase_from: z.string().optional().nullable(),
  purchase_price: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  purchase_conversion_rate: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  purchase_price_inr: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  availability: z.string().optional().nullable(),

  // Dimensions & Measurements
  measurement: z.string().optional().nullable(),
  length: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  width: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  depth: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  table_percentage: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  depth_percentage: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  ratio: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  crn_ag: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  crn_ht: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  pav_ag: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  pav_dp: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  str_ln: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  lr_half: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  girdle: z.string().optional().nullable(),
  girdle_condition: z.string().optional().nullable(),
  girdle_pct: z.string().optional().nullable(),
  culet_size: z.string().optional().nullable(),

  // Additional Features & Comments
  polish_features: z.string().optional().nullable(),
  symmetry_features: z.string().optional().nullable(),
  painting: z.string().optional().nullable(),
  proportion: z.string().optional().nullable(),
  paint_comm: z.string().optional().nullable(),
  key_to_symbols: z.string().optional().nullable(),
  report_comments: z.string().optional().nullable(),

  // Additional Technical Details
  inscription: z.string().optional().nullable(),
  synthetic_indicator: z.string().optional().nullable(),
  agsi_aset: z.string().optional().nullable(),
  shape_description: z.string().optional().nullable(),
  report_type: z.string().optional().nullable(),
  sorting: z.string().optional().nullable(),
  basket_status: z.string().optional().nullable(),

  // Payment Information
  payment_status: z.string().optional().nullable(),
  buying_date: z.string().optional().nullable(),
  terms_days: z.preprocess((v) => toNumberOrNull(v), z.number().nullable().optional()),
  payment_amount_done: z.preprocess((v) => toNumberOrZero(v), z.number().optional()),
  location: z.string().optional().nullable(),
});

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const availability = url.searchParams.get("availability") || "";

    // Check auth for price visibility
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const isAuthenticated = !!(token && verifyToken(token));

    let q = knex("diamonds").select("*").orderBy("id", "desc");
    if (availability) q = q.where("availability", availability);

    const rows = await q;

    // Filter prices if not authenticated
    const processedRows = isAuthenticated ? rows : rows.map(d => {
      const clean = { ...d };
      [
        "rap_rate", "rap_discount", "price_per_carat_usd", "amount_usd", "pur_rap_discount",
        "conversion_rate", "amount_inr", "purchase_from", "purchase_price",
        "purchase_conversion_rate", "purchase_price_inr"
      ].forEach(f => delete clean[f]);
      return clean;
    });

    return new Response(JSON.stringify(processedRows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET Error:", e);
    return new Response(e.message, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token || !verifyToken(token)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Debug log
    console.log("=== API RECEIVED ===");
    console.log("Location:", body.location);
    console.log("rap_rate:", body.rap_rate);
    console.log("rap_discount:", body.rap_discount);
    console.log("pur_rap_discount:", body.pur_rap_discount);

    // Parse and validate
    const parsed = diamondSchema.parse(body);

    // Debug log after parsing
    console.log("=== AFTER PARSING ===");
    console.log("rap_rate:", parsed.rap_rate);
    console.log("rap_discount:", parsed.rap_discount);

    // Prepare data for insertion - ensure NOT NULL fields have values
    const insertData = {
      // Basic Info
      stone_type: parsed.stone_type || null,
      lab: parsed.lab || null,
      diamond_id: parsed.diamond_id || null,
      certificate_number: parsed.certificate_number || null,
      shape: parsed.shape,
      weight: parsed.weight,
      color: parsed.color,
      clarity: parsed.clarity,
      cut: parsed.cut,
      pol: parsed.pol || null,
      sym: parsed.sym || null,
      flor: parsed.flor || null,
      eye_clean: parsed.eye_clean || null,
      no_bgm: parsed.no_bgm || null,

      // Report & Reference
      job_no: parsed.job_no || null,
      control_no: parsed.control_no || null,
      diamond_dossier: parsed.diamond_dossier || null,
      report_no: parsed.report_no || null,
      report_dt: parsed.report_dt || null,
      client_ref: parsed.client_ref || null,
      memo_no: parsed.memo_no || null,

      // Quality
      color_descriptions: parsed.color_descriptions || null,
      clarity_status: parsed.clarity_status || null,
      final_cut: parsed.final_cut || null,
      fluorescence_intensity: parsed.fluorescence_intensity || null,
      fluorescence_color: parsed.fluorescence_color || null,

      // Origin
      country_of_origin: parsed.country_of_origin || null,
      rough_report_number: parsed.rough_report_number || null,
      diamond_type: parsed.diamond_type || null,
      disclosed_source: parsed.disclosed_source || null,
      kimberley_process_number: parsed.kimberley_process_number || null,
      rough_invoice_number: parsed.rough_invoice_number || null,

      // Price - NOT NULL fields (use 0 as default)
      rap_rate: parsed.rap_rate ?? 0,
      rap_discount: parsed.rap_discount ?? 0,
      price_per_carat_usd: parsed.price_per_carat_usd ?? 0,
      amount_usd: parsed.amount_usd ?? 0,
      pur_rap_discount: parsed.pur_rap_discount ?? 0,

      // Price - Nullable fields
      conversion_rate: parsed.conversion_rate ?? null,
      amount_inr: parsed.amount_inr ?? null,
      purchase_from: parsed.purchase_from || null,
      purchase_price: parsed.purchase_price ?? null,
      purchase_conversion_rate: parsed.purchase_conversion_rate ?? null,
      purchase_price_inr: parsed.purchase_price_inr ?? null,
      client_id: parsed.client_id ?? null,
      broker_id: parsed.broker_id ?? null,
      availability: parsed.availability || "available",

      // Dimensions
      measurement: parsed.measurement || null,
      length: parsed.length ?? null,
      width: parsed.width ?? null,
      depth: parsed.depth ?? null,
      table_percentage: parsed.table_percentage ?? null,
      depth_percentage: parsed.depth_percentage ?? null,
      ratio: parsed.ratio ?? null,
      crn_ag: parsed.crn_ag ?? null,
      crn_ht: parsed.crn_ht ?? null,
      pav_ag: parsed.pav_ag ?? null,
      pav_dp: parsed.pav_dp ?? null,
      str_ln: parsed.str_ln ?? null,
      lr_half: parsed.lr_half ?? null,
      girdle: parsed.girdle || null,
      girdle_condition: parsed.girdle_condition || null,
      girdle_pct: parsed.girdle_pct || null,
      culet_size: parsed.culet_size || null,

      // Features
      polish_features: parsed.polish_features || null,
      symmetry_features: parsed.symmetry_features || null,
      painting: parsed.painting || null,
      proportion: parsed.proportion || null,
      paint_comm: parsed.paint_comm || null,
      key_to_symbols: parsed.key_to_symbols || null,
      report_comments: parsed.report_comments || null,

      // Technical
      inscription: parsed.inscription || null,
      synthetic_indicator: parsed.synthetic_indicator || null,
      agsi_aset: parsed.agsi_aset || null,
      shape_description: parsed.shape_description || null,
      report_type: parsed.report_type || null,
      sorting: parsed.sorting || null,
      basket_status: parsed.basket_status || null,

      // Payment Information
      payment_status: parsed.payment_status || null,
      buying_date: parsed.buying_date || null,
      terms_days: parsed.terms_days || 0,
      location: parsed.location || "Surat",
    };

    console.log("=== INSERT DATA ===");
    console.log("rap_rate:", insertData.rap_rate);
    console.log("rap_discount:", insertData.rap_discount);

    const [id] = await knex("diamonds").insert(insertData);

    // Track creation history - OPTIMIZED: Removed implicit creation event
    // The "CREATED" event is now synthesized dynamically in the history API logic
    /*
    await knex("diamond_history").insert({
      diamond_id: id,
      event_type: "CREATED",
      from_place: null,
      to_place: insertData.location,
      notes: "Diamond created",
      created_at: knex.fn.now()
    });
    */

    // Handle Payment Outstanding if "On Terms"
    if (parsed.payment_status === "On Terms") {
      await knex("payment_outstanding").insert({
        diamond_id: id,
        payment_amount_done: parsed.payment_amount_done || 0
      });
    }

    const created = await knex("diamonds").where({ id }).first();

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("POST Error:", e);
    const msg = e.errors ? JSON.stringify(e.errors) : (e.message || "Bad request");
    return new Response(msg, { status: 400 });
  }
}
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/services/authService";
import db from "../../../lib/db";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const onlyAvailable = searchParams.get("available") === "true";
    const lotNumber = searchParams.get("lot_number");
    const colorCategory = searchParams.get("color_category"); // Comma-separated
    const sizeCategory = searchParams.get("size_category"); // Comma-separated
    const grade = searchParams.get("grade"); // Comma-separated
    const caratMin = parseFloat(searchParams.get("caratMin"));
    const caratMax = parseFloat(searchParams.get("caratMax"));
    const priceMin = parseFloat(searchParams.get("priceMin"));
    const priceMax = parseFloat(searchParams.get("priceMax"));

    let query = db("loose_diamond_items")
      .join("loose_diamond", "loose_diamond_items.loose_diamond_id", "loose_diamond.id")
      .where("loose_diamond.user_id", decoded.id)
      .select(
        "loose_diamond_items.*",
        "loose_diamond.lot_number",
        "loose_diamond.supplier_name",
        "loose_diamond.purchase_date"
      );

    // Filters
    if (onlyAvailable) {
      query = query.where("loose_diamond_items.carats", ">", 0);
    }

    if (lotNumber) {
      query = query.where("loose_diamond.lot_number", "like", `%${lotNumber}%`);
    }

    if (colorCategory) {
      const colors = colorCategory.split(",").filter(Boolean);
      if (colors.length) query = query.whereIn("loose_diamond_items.color_category", colors);
    }

    if (sizeCategory) {
      const sizes = sizeCategory.split(",").filter(Boolean);
      if (sizes.length) query = query.whereIn("loose_diamond_items.size_category", sizes);
    }

    if (grade) {
      const grades = grade.split(",").filter(Boolean);
      if (grades.length) query = query.whereIn("loose_diamond_items.grade", grades);
    }

    if (!isNaN(caratMin)) {
      query = query.where("loose_diamond_items.carats", ">=", caratMin);
    }
    if (!isNaN(caratMax)) {
      query = query.where("loose_diamond_items.carats", "<=", caratMax);
    }

    if (!isNaN(priceMin)) {
      query = query.where("loose_diamond_items.final_price_per_carat", ">=", priceMin);
    }
    if (!isNaN(priceMax)) {
      query = query.where("loose_diamond_items.final_price_per_carat", "<=", priceMax);
    }

    const items = await query
      .orderBy("loose_diamond.created_at", "desc")
      .orderBy("loose_diamond_items.id", "asc");

    return Response.json(items);
  } catch (err) {
    console.error("Fetch loose items error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

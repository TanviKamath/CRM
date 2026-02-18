import knex from "../../../lib/db";
import ExcelJS from "exceljs";

export async function POST(request) {
  try {
    const { ids, filters } = await request.json();

    let query = knex("diamonds")
      .select(
        "diamonds.*", // Select all fields
        // Add any related fields if needed, e.g., from sales or clients
      )
      .orderBy("created_at", "desc");

    // If specific IDs are provided, filter by them
    if (ids && ids.length > 0) {
      query = query.whereIn("id", ids);
    } else if (filters) {
      // Apply filters otherwise (mirroring the search logic from page.js roughly if possible, 
      // but for now, rely on IDs for selection or just dump all if "export all" is clicked without filters)
      // The user requirement says "select the rows too and export", "export particular rows".
      // We will support "Export All" as well.

      // Basic filtering support if passed
      if (filters.availability) {
        query = query.where("availability", filters.availability);
      }

      // Note: Full text search string 'q' is harder to replicate exactly in one go without duplicate logic,
      // but if the user wants "Export All" while filtered, we should probably pass the IDs of the filtered result 
      // from the frontend to be safe and accurate to what they see. 
      // However, for large datasets, passing IDs is better.
    }

    const diamonds = await query;

    // Create Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Diamond Tech";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Diamonds Stock");

    // Define Columns
    worksheet.columns = [
      { header: "Date Added", key: "date", width: 12 },
      { header: "Diamond ID", key: "diamond_id", width: 15 },
      { header: "Lab", key: "lab", width: 10 },
      { header: "Shape", key: "shape", width: 12 },
      { header: "Weight (ct)", key: "weight", width: 12 },
      { header: "Color", key: "color", width: 10 },
      { header: "Clarity", key: "clarity", width: 10 },
      { header: "Cut", key: "cut", width: 10 },
      { header: "Polish", key: "polish", width: 10 },
      { header: "Symmetry", key: "symmetry", width: 10 },
      { header: "Fluor", key: "fluorescence", width: 12 },
      { header: "Measurements", key: "measurements", width: 20 },
      { header: "Price (USD)", key: "price_usd", width: 15 },
      { header: "Total (USD)", key: "total_usd", width: 15 },
      { header: "Discount (%)", key: "rap_discount", width: 12 },
      { header: "Status", key: "status", width: 15 },
      { header: "Location", key: "location", width: 15 },
      { header: "Table %", key: "table_percent", width: 10 },
      { header: "Depth %", key: "depth_percent", width: 10 },
      { header: "Remarks", key: "remarks", width: 30 },
    ];

    // Style Header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add Rows
    diamonds.forEach((d) => {
      worksheet.addRow({
        date: d.created_at ? new Date(d.created_at).toISOString().split("T")[0] : "",
        diamond_id: d.diamond_id || d.certificate_number,
        lab: d.lab,
        shape: d.shape,
        weight: parseFloat(d.weight) || 0,
        color: d.color,
        clarity: d.clarity,
        cut: d.cut,
        polish: d.polish,
        symmetry: d.symmetry,
        fluorescence: d.fluorescence,
        measurements: d.measurements,
        price_usd: parseFloat(d.price_per_carat) || 0,
        total_usd: parseFloat(d.amount_usd) || 0,
        rap_discount: parseFloat(d.rap_discount) || 0,
        status: d.availability,
        location: d.location,
        table_percent: d.table_percent,
        depth_percent: d.depth_percent,
        remarks: d.notes,
      });
    });

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="diamonds_export.xlsx"',
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return Response.json({ error: "Failed to export data" }, { status: 500 });
  }
}

const db = require("../app/lib/db");

async function checkLot33() {
  const lot = await db("loose_diamond").where("lot_number", "33").first();
  if (!lot) {
    console.log("Lot 33 not found");
    process.exit(0);
  }
  console.log("Lot 33:", lot);

  const items = await db("loose_diamond_items").where("loose_diamond_id", lot.id);
  console.log("Items for Lot 33:", items);

  for (const item of items) {
    const memos = await db("on_memo").where("loose_diamond_item_id", item.id).where("status", "active");
    console.log(`Active Memos for Item ${item.id}:`, memos);
    
    const sum = await db("on_memo")
      .where("loose_diamond_item_id", item.id)
      .where("status", "active")
      .sum("carats as total")
      .first();
    console.log(`Sum of active memo carats for Item ${item.id}:`, sum.total);
  }
  process.exit(0);
}

checkLot33();

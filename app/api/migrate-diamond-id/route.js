import knex from "../../lib/db";

export async function GET() {
    try {
        const hasColumn = await knex.schema.hasColumn("diamonds", "diamond_id");
        if (!hasColumn) {
            await knex.schema.table("diamonds", (table) => {
                table.string("diamond_id").nullable().after("id");
            });
            return Response.json({ message: "Column diamond_id added successfully" });
        }
        return Response.json({ message: "Column diamond_id already exists" });
    } catch (error) {
        console.error("Migration error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

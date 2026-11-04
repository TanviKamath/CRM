// Cut is optional for non-standard shapes. Older databases may still have the column as NOT NULL,
// so a blank cut is stored as NULL when allowed and as an empty string otherwise.
let nullable = null;

export async function blankCutValue(knex) {
  if (nullable === null) {
    try {
      const info = await knex("diamonds").columnInfo("cut");
      nullable = info?.nullable !== false;
    } catch {
      nullable = false;
    }
  }
  return nullable ? null : "";
}

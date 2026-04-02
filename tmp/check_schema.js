const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    port: 3307, // Matching .env.local
    user: 'root',
    password: '',
    database: 'diamond_db',
  }
});

async function run() {
  try {
    const columns = await knex('loose_diamond_sales').columnInfo();
    console.log(JSON.stringify(columns, null, 2));
    await knex.destroy();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();

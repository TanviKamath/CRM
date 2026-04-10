const fs=require('fs'); 
const env=fs.readFileSync('.env.local', 'utf8'); 
env.split('\n').forEach(line => {
  const parts=line.split('=');
  if(parts.length>=2){
    process.env[parts[0].trim()] = parts.slice(1).join('=').trim()
  }
}); 
const db=require('../app/lib/db'); 

const sql = `CREATE TABLE IF NOT EXISTS on_memo ( 
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
  loose_diamond_item_id BIGINT UNSIGNED NOT NULL, 
  client_id BIGINT UNSIGNED NULL, 
  broker_id BIGINT UNSIGNED NULL, 
  carats DECIMAL(10,3) NOT NULL, 
  status ENUM('active', 'sold', 'returned') DEFAULT 'active', 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
  FOREIGN KEY (loose_diamond_item_id) REFERENCES loose_diamond_items(id) ON DELETE CASCADE, 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL, 
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE SET NULL 
);`;

db.raw(sql)
  .then(()=>console.log('Table created'))
  .catch(console.error)
  .finally(()=>process.exit());

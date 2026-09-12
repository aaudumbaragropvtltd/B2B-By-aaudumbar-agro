async function testDatabaseEndpoints() {
  console.log('--- TESTING DATABASE ENDPOINTS ---');
  const tables = ['users', 'logistics', 'products', 'trade_orders', 'payments', 'rfqs', 'rfq_quotes', 'search_logs'];
  
  for (const t of tables) {
    try {
      const res = await fetch(`http://localhost:3000/api/admin/database?table=${t}`);
      if (!res.ok) {
        console.log(`❌ Table [${t}] failed with status: ${res.status}`);
      } else {
        const data = await res.json();
        console.log(`✅ Table [${t}]: ${data.length} records returned. Sample fields:`, data[0] ? Object.keys(data[0]).slice(0, 6) : 'Empty');
      }
    } catch (err) {
      console.log(`❌ Table [${t}] error:`, err.message);
    }
  }
}

testDatabaseEndpoints();

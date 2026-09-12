import pg from 'pg';
const { Client } = pg;

// Test standard Supabase postgres connection strings
const connectionStrings = [
  'postgresql://postgres:kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII@db.ihsgymlxdgmdrtwlnetr.supabase.co:5432/postgres',
  'postgresql://postgres.ihsgymlxdgmdrtwlnetr:kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.ihsgymlxdgmdrtwlnetr:kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
];

async function testPgConnection() {
  console.log('Testing Postgres connections...');
  for (const conn of connectionStrings) {
    try {
      const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
      await client.connect();
      console.log(`✅ Successfully connected with: ${conn}`);
      const res = await client.query('SELECT current_database(), current_user;');
      console.log('Database Info:', res.rows);
      await client.end();
      return conn;
    } catch (err) {
      console.log(`❌ Failed connecting with [${conn.slice(0, 40)}...]: ${err.message}`);
    }
  }
}

testPgConnection();

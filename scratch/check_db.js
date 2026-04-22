const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envFile = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
const lines = envFile.split('\n');
const env = {};
lines.forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  console.log("Checking for 'is_indexed' column in 'photos' table...");
  const { data, error } = await supabase
    .from('photos')
    .select('is_indexed')
    .limit(1);

  if (error) {
    if (error.code === '42703') {
      console.error("❌ ERROR: Column 'is_indexed' does NOT exist.");
    } else {
      console.error("❌ ERROR:", error.message);
    }
  } else {
    console.log("✅ SUCCESS: Column 'is_indexed' exists!");
  }
}

checkColumn();

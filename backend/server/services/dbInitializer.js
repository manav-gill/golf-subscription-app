const supabase = require('../config/supabase');

const TABLES_TO_CHECK = ['users', 'charities', 'scores', 'draws', 'winners'];

async function initializeDatabase() {
  console.log('[dbInitializer] Validating required database tables');

  const missingTables = [];

  for (const table of TABLES_TO_CHECK) {
    try {
      const { error } = await supabase.from(table).select().limit(0);
      
      if (error) {
        if (error.code === 'PGRST205') {
          missingTables.push(table);
          console.warn(`[dbInitializer] Table missing: ${table}`);
        } else {
          console.warn(`[dbInitializer] Error checking ${table}: ${error.message}`);
        }
      } else {
        console.log(`[dbInitializer] ✓ Table found: ${table}`);
      }
    } catch (err) {
      console.error(`[dbInitializer] Failed to check table ${table}:`, err.message);
      missingTables.push(table);
    }
  }

  if (missingTables.length > 0) {
    const msg = `[dbInitializer] CRITICAL: Missing tables: ${missingTables.join(', ')}. Please run SQL setup scripts in Supabase console.`;
    console.error(msg);
    throw new Error(msg);
  }

  console.log('[dbInitializer] ✓ All required tables validated');
}

module.exports = { initializeDatabase };

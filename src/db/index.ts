import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pkg;

type DrizzleDb = NodePgDatabase<typeof schema>;

let poolInstance: pkg.Pool | null = null;
let dbInstance: DrizzleDb | null = null;

// Function to create a new connection pool.
export const createPool = () => {
  const host = process.env.SQL_HOST;
  const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER;
  const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD;
  const database = process.env.SQL_DB_NAME;

  console.log(`[DB Initialization] Creating new connection pool...`);
  console.log(`  Host: ${host}`);
  console.log(`  Database: ${database}`);
  console.log(`  User: ${user}`);
  console.log(`  Has Password: ${password ? "Yes" : "No"}`);

  if (!host) {
    console.warn("[WARNING] SQL_HOST is undefined during database pool creation!");
  }

  return new Pool({
    host,
    user,
    password,
    database,
    connectionTimeoutMillis: 15000,
  });
};

// Lazy getter for the drizzle database instance
export function getDb() {
  if (!dbInstance) {
    poolInstance = createPool();

    // Prevent unhandled pool-level errors from crashing the application.
    poolInstance.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });

    dbInstance = drizzle(poolInstance, { schema });
  }
  return dbInstance;
}

// Export a Proxy for the db object so any imports `import { db } from "./index.ts"`
// resolve lazily and dynamically on first use.
export const db = new Proxy({} as unknown as DrizzleDb, {
  get(target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export type DbType = typeof db;
export { schema };

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getPool(): pg.Pool {
  if (!poolInstance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL must be set. Add it in Railway → Variables.",
      );
    }
    poolInstance = new Pool({
      connectionString: url,
      connectionTimeoutMillis: 15_000,
      ssl: url.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
    });
  }
  return poolInstance;
}

/** Lazy pool wrapper so the app can boot before DATABASE_URL is validated */
export const pool = {
  query: (
    ...args: Parameters<pg.Pool["query"]>
  ): ReturnType<pg.Pool["query"]> => getPool().query(...args),
};

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getDb();
    const value = instance[prop as keyof typeof instance];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

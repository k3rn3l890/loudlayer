/**
 * db-pg.ts — PostgreSQL database connector
 *
 * Re-exports the query function and utilities from db.ts.
 * All route files import from ../db-pg; this file bridges
 * to the actual PostgreSQL pool in db.ts.
 */
export { query, getClient } from "./db";

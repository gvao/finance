import { DatabaseSync } from "node:sqlite"
import type { Datasource } from "./types.js"

export function makeSqliteDatabase(dbPath: string = ':memory:'): Datasource {
    const db = new DatabaseSync(dbPath)

    return {
        query: async (sql: string, params?: any[]) => {
            const stmt = db.prepare(sql)
            if (params) {
                return stmt.all(...params)
            }
            return stmt.all()
        },
        run: async (sql: string, params?: any[]) => {
            const stmt = db.prepare(sql)
            if (params) {
                await stmt.run(...params)
            } else {
                await stmt.run()
            }
        }
    }
}


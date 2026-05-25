import { DatabaseSync } from "node:sqlite"
import type { Datasource } from "./types.js"

export function makeSqliteDatasource(dbPath: string = ':memory:'): Datasource {
    const db = new DatabaseSync(dbPath)
    const datasource: Datasource = {
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
        },
        unitOfWork: async (middleware) => {
            db.exec("BEGIN");
            try {
                const result = await middleware(datasource);
                db.exec("COMMIT");
                return result;
            } catch (error) {
                db.exec("ROLLBACK");
                throw error;
            }
        }
    }

    return datasource
}


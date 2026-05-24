import path from "node:path"
import { beforeAll, describe, expect, it } from "vitest"

import { makeSqliteDatasource } from "../infra/datasource/sqlite.datasource.js"
import { getMigrations, migrate } from "../infra/datasource/migrate.js"

describe('connectToDatabase', () => {
    const sqliteDatasource = makeSqliteDatasource()

    describe("migrations", () => {

        beforeAll(async () => {
            const migrationsDirPath = path.resolve(process.cwd(), "src/infra/datasource/migrations")
            const migrations = await migrate(sqliteDatasource, migrationsDirPath)
            expect(migrations).toHaveLength(3)
        })

        it('should have 3 migrations', async () => {
            const tables = await sqliteDatasource.query(`SELECT name FROM sqlite_master WHERE type='table'`)
            const row = await getMigrations(sqliteDatasource)
            expect(row).toHaveLength(3)
            expect(tables).toHaveLength(3)

        })
    })
})



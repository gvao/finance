import path from "node:path"
import { beforeAll, describe, expect, it } from "vitest"

import { makeSqliteDatabase } from "../infra/datasource/sqlite.datasource.js"
import { getMigrations, migrate } from "../infra/datasource/migrate.js"

describe('connectToDatabase', () => {
    const sqliteDatasource = makeSqliteDatabase()

    describe("migrations", () => {

        beforeAll(async () => {
            const migrationsDirPath = path.resolve(process.cwd(), "src/infra/datasource/migrations")
            const migrations = await migrate(migrationsDirPath, sqliteDatasource)
            expect(migrations).toHaveLength(3)
        })

        it('should have 3 migrations', async () => {
            const row = await getMigrations(sqliteDatasource)
            expect(row).toHaveLength(3)
        })
    })
})



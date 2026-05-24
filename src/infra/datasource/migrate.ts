import { readdir, readFile } from "node:fs/promises"
import path from "path"
import type { Datasource } from "./types.js"

export async function getMigrations(db: Datasource) {
    try {
        const migrations = await db.query(`SELECT * FROM migrations`)
        return migrations
    } catch (error) {
        return []
    }
}

export async function migrate(
    db: Datasource,
    dirPath: string = path.resolve(process.cwd(), "src/infra/datasource/migrations")
) {
    const fileNames = await readdir(dirPath)

    const result = []

    for (const fileName of fileNames) {
        const migrations = await getMigrations(db)
        const date = new Date()
        const filePath = path.join(dirPath, fileName)
        const [order, name] = fileName.split('-') as [string, string]
        const statement = await readFile(filePath, "utf-8")

        if (migrations.length === 0) {
            if (order !== "000") continue
            await db.run(statement)
        }

        await db.run(statement)
        await db.run(
            'INSERT INTO migrations (id, name, create_at) VALUES (?, ?, ?)',
            [order, name.replace('.sql', ''), date.toISOString()]
        )
        result.push({ order, name, statement })
    }
    return result
}
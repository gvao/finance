import type { Datasource } from "../../../infra/datasource/types.js";
import type { CommandBuilderDto, Command, CommandStore } from "./types.js";

export const buildCommand = ({ aggregateId, data, type, id = crypto.randomUUID(), createdAt = new Date(), updatedAt = new Date(), status = "pending" }: CommandBuilderDto): Command => ({
    id,
    aggregateId,
    data,
    type,
    createdAt,
    updatedAt,
    status,
})

export function makeCommandStore(datasource: Datasource): CommandStore {

    const tableName = "commands";

    return {

        async getCommands(): Promise<Command[]> {
            const commands = await datasource.query(`SELECT * FROM ${tableName}`)
            return commands.map((row: any) => buildCommand({
                id: row.id,
                aggregateId: row.aggregate_id,
                type: row.type,
                data: JSON.parse(row.data),
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                status: row.status,
            }));
        },

        async appendCommand(command: Command,): Promise<void> {
            const { id, aggregateId, type, data, createdAt, status, updatedAt } = command;
            return datasource.run(
                `INSERT 
                INTO ${tableName} (id, aggregate_id, type, data, created_at, status, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, aggregateId, type, JSON.stringify(data), createdAt.toISOString(), status, updatedAt.toISOString()]
            );
        },

        async getCommandsByAggregateId(aggregateId: string,): Promise<Command[]> {

            const result = await datasource.query(
                `SELECT * FROM ${tableName} WHERE aggregate_id = ?`,
                [aggregateId]
            )
            return result.map((row: any) => buildCommand({
                id: row.id,
                aggregateId: row.aggregate_id,
                type: row.type,
                data: JSON.parse(row.data),
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                status: row.status,
            }));
        },

        async getPending(): Promise<Command[]> {
            const result = await datasource.query(
                `SELECT * FROM ${tableName} WHERE status = ?`,
                ["pending"]
            )
            return result.map((row: any) => buildCommand({
                id: row.id,
                aggregateId: row.aggregate_id,
                type: row.type,
                data: JSON.parse(row.data),
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                status: row.status,
            }));
        },

        async failedCommand(id: string): Promise<void> {
            return datasource.run(
                `UPDATE ${tableName} SET status = ? WHERE id = ?`,
                ["failed", id]
            );
        },

        async processedCommand(id: string): Promise<void> {
            return datasource.run(
                `UPDATE ${tableName} SET status = ? WHERE id = ?`,
                ["processed", id]
            );
        },

    }
}

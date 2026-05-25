import type { Datasource } from "../../../infra/datasource/types.js";
import type { EventRecord } from "../event/types.js";
import type { CommandBuilderDto, Command, CommandStore, CommandBus, CommandHandler } from "./types.js";

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

        async appendCommand(command: Command,) {
            const { id, aggregateId, type, data, createdAt, status, updatedAt } = command;
            datasource.run(
                `INSERT 
                INTO ${tableName} (id, aggregate_id, type, data, created_at, status, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, aggregateId, type, JSON.stringify(data), createdAt.toISOString(), status, updatedAt.toISOString()]
            );
            return [{ commandId: id }, []]
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

        async markAsFailed(id: string): Promise<void> {
            return datasource.run(
                `UPDATE ${tableName} SET status = ? WHERE id = ?`,
                ["failed", id]
            );
        },

        async markAsProcessed(id: string): Promise<void> {
            return datasource.run(
                `UPDATE ${tableName} SET status = ? WHERE id = ?`,
                ["processed", id]
            );
        },

        async getCommandById(id: string): Promise<Command> {
            const result = await datasource.query(
                `SELECT * FROM ${tableName} WHERE id = ?`,
                [id]
            )
            if (!result.length) {
                throw new Error(`Command not found: ${id}`)
            }
            const row = result[0]
            return buildCommand({
                id: row.id,
                aggregateId: row.aggregate_id,
                type: row.type,
                data: JSON.parse(row.data),
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                status: row.status,
            });
        },

    }
}

export function composeCommandBus(commandStore: CommandStore, datasource: Datasource): CommandStore & CommandBus {

    const handlers: Record<string, CommandHandler> = {}

    function register(commandType: Command["type"], handler: CommandHandler) {
        handlers[commandType] = handler;
    }

    function dispatch(commandType: Command["type"], command: Command) {
        const handler = handlers[commandType];
        if (handler) return handler(commandType, command);
        return Promise.resolve([]);
    }

    return {
        ...commandStore,

        register,
        handle: dispatch,

        async appendCommand(command: Command): Promise<[{ commandId: string }, EventRecord[]]> {
            return datasource.unitOfWork(async (datasource) => {
                await commandStore.appendCommand(command);
                const events = await dispatch(command.type, command);
                return [{ commandId: command.id }, events]
            })
        },

        async markAsFailed(id) {
            return datasource.unitOfWork(async (datasource) => {
                await commandStore.markAsFailed(id);
                const command = await commandStore.getCommandById(id);
                dispatch(command.type, command);
            })
        },

        async markAsProcessed(id) {
            return datasource.unitOfWork(async (datasource) => {
                await commandStore.markAsProcessed(id);
                const command = await commandStore.getCommandById(id);
                dispatch(command.type, command);
            })
        },

    }
}
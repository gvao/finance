import { beforeEach, describe, expect, it } from "vitest";
import { makeSqliteDatasource } from "../../../infra/datasource/sqlite.datasource.js";
import { migrate } from "../../../infra/datasource/migrate.js";
import { makeCommandStore, buildCommand, composeCommandBus } from "./command-store.js";
import type { Command, CommandBus, CommandHandler, CommandStore } from "./types.js";
import type { Datasource } from "../../../infra/datasource/types.js";

describe("CommandStore", () => {
    let commandStore: CommandStore & CommandBus;
    let sqliteDatasource: Datasource;

    const aggregate = {
        id: crypto.randomUUID(),
    }

    beforeEach(async () => {
        sqliteDatasource = makeSqliteDatasource();
        commandStore = composeCommandBus(makeCommandStore(sqliteDatasource), sqliteDatasource)

        await migrate(sqliteDatasource)
        const commands = await commandStore.getCommands();
        expect(commands).toHaveLength(0)
    })

    describe("CommandStore", () => {

        it("should register a command handler and dispatch a command", async () => {
            const command: Command = buildCommand({
                aggregateId: aggregate.id,
                type: "TEST_COMMAND",
                data: { foo: "bar" },
            })

            const handler: CommandHandler = async (type, command) => {
                expect(type).toBe("TEST_COMMAND");
                expect(command).toEqual(command);
                return [];
            }
            commandStore.register("TEST_COMMAND", handler);
            commandStore.handle("TEST_COMMAND", command);
        })

        it("append a command to the store", async () => {
            const createdAt = new Date();
            const command: Command = buildCommand({
                aggregateId: aggregate.id,
                type: "TEST_COMMAND",
                data: { foo: "bar" },
                createdAt,
            })

            const commandhandler: CommandHandler = async (type, command) => {
                expect(type).toBe("TEST_COMMAND");
                expect(command).toEqual(command);
                return [];
            }

            commandStore.register("TEST_COMMAND", commandhandler);

            await commandStore.appendCommand(command)
            const commands = await commandStore.getCommands();
            expect(commands).toHaveLength(1)
            expect(commands[0]).toEqual({
                id: command.id,
                aggregateId: aggregate.id,
                type: "TEST_COMMAND",
                data: { foo: "bar" },
                status: "pending",
                createdAt: createdAt,
                updatedAt: command.updatedAt,
            })
        })

        it("should return all commands for an aggregate", async () => {
            const command1: Command = buildCommand({
                aggregateId: aggregate.id,
                type: "TEST_COMMAND",
                data: { foo: "bar" }
            })
            const command2: Command = buildCommand({
                aggregateId: aggregate.id,
                type: "TEST_COMMAND",
                data: { foo: "bar" }
            })
            const command3: Command = buildCommand({
                aggregateId: "any_aggregate_id",
                type: "TEST_COMMAND",
                data: { foo: "bar" }
            })
            await commandStore.appendCommand(command1)
            await commandStore.appendCommand(command2)
            await commandStore.appendCommand(command3)
            const commands = await commandStore.getCommandsByAggregateId(aggregate.id);
            expect(commands).toHaveLength(2)
        })

        it("should return an empty array if no commands found for an aggregate", async () => {
            const commands = await commandStore.getCommandsByAggregateId("non_existent_aggregate_id");
            expect(commands).toHaveLength(0)
        })

        it("should return pending commands", async () => {

            const command1 = buildCommand({ aggregateId: aggregate.id, type: "TEST_COMMAND", data: { foo: "bar" } })
            const command2 = buildCommand({ aggregateId: aggregate.id, type: "TEST_COMMAND", data: { foo: "bar" } })
            const command3 = buildCommand({ aggregateId: aggregate.id, type: "TEST_COMMAND", data: { foo: "bar" } })

            await commandStore.appendCommand(command1)
            await commandStore.appendCommand(command2)
            await commandStore.appendCommand(command3)
            await commandStore.markAsFailed(command2.id)
            await commandStore.markAsProcessed(command3.id)

            const pendingCommands = await commandStore.getPending()
            expect(pendingCommands).toHaveLength(1)
        })

        it("should mark a command as processed", async () => {
            const command = buildCommand({ aggregateId: aggregate.id, type: "TEST_COMMAND", data: { foo: "bar" } })
            await commandStore.appendCommand(command)
            await commandStore.markAsProcessed(command.id)
            const commandOnStore = await commandStore.getCommandById(command.id);
            expect(commandOnStore.status).toBe("processed")
            expect(commandOnStore.id).toBe(command.id)
        })

    })
})


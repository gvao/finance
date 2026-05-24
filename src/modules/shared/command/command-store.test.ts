import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeSqliteDatasource } from "../../../infra/datasource/sqlite.datasource.js";
import type { Datasource } from "../../../infra/datasource/types.js";
import { migrate } from "../../../infra/datasource/migrate.js";
import { makeCommandStore, buildCommand } from "./command-store.js";
import type { Command, CommandStore } from "./types.js";

describe("CommandStore", () => {
    let commandStore: CommandStore;

    const aggregate = {
        id: crypto.randomUUID(),
    }

    beforeEach(async () => {
        const sqliteDatasource = makeSqliteDatasource();
        commandStore = makeCommandStore(sqliteDatasource);

        await migrate(sqliteDatasource)
        const commands = await commandStore.getCommands();
        expect(commands).toHaveLength(0)
    })

    it("append a command to the store", async () => {
        const createdAt = new Date();
        const command: Command = buildCommand({
            aggregateId: aggregate.id,
            type: "TEST_COMMAND",
            data: { foo: "bar" },
            createdAt,
        })

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

        await Promise.all([
            commandStore.appendCommand(command1),
            commandStore.appendCommand(command2),
            commandStore.appendCommand(command3),
        ])
        await Promise.all([
            commandStore.failedCommand(command2.id),
            commandStore.processedCommand(command3.id),
        ])

        const pendingCommands = await commandStore.getPending()
        expect(pendingCommands).toHaveLength(1)
    })

});

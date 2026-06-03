import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { makeFinanceModule } from "./index.module.js"
import { buildCommand, composeCommandBus, makeCommandStore } from "../shared/command/command-store.js"
import { makeSqliteDatasource } from "../../infra/datasource/sqlite.datasource.js"
import { composeEventPublisher, makeEventStore } from "../shared/event/event-store.js"
import type { Module } from "../shared/module.type.js"

describe("finance", () => {
    const aggregate = { id: crypto.randomUUID() }

    let financeModule: Module
    let commands: string[] = []

    const datasource = makeSqliteDatasource()
    const eventPublisher = composeEventPublisher(makeEventStore(datasource))
    const commandBus = composeCommandBus(makeCommandStore(datasource), datasource)

    beforeAll(() => {
        financeModule = makeFinanceModule({ datasource })
        commands = Object.keys(financeModule.commands)
    })

    it("create recurrence", async () => {
        const type: keyof typeof commands = "create-recurrence"
        const eventExpected = { type: "finance:recurrence-created" }

        const command = buildCommand({
            aggregateId: aggregate.id,
            type: "create-recurrence",
            data: {
                amount: 1000.02
            }
        })

        const { commands } = financeModule
        const commandHandler = commands[type]
        if (!commandHandler) throw new Error("Handler not found")
        commandBus.register(type, commandHandler)
        eventPublisher.subscribe(event => {
            expect(event).toEqual(eventExpected)
        })

        const [event] = await commandBus.handle("create-recurrence", command)
        if (!event) throw new Error("Event not found")
        eventPublisher.publish(event)
        expect(event).toEqual(eventExpected)
    })


})
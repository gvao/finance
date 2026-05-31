import { beforeAll, describe, it } from "vitest"
import { makeFinanceModule } from "./index.module.js"
import { composeCommandBus, makeCommandStore } from "../shared/command/command-store.js"
import { makeSqliteDatasource } from "../../infra/datasource/sqlite.datasource.js"
import { composeEventPublisher, makeEventStore } from "../shared/event/event-store.js"
import type { Module } from "../shared/module.type.js"

describe("finance", () => {
    let financeModule: Module

    beforeAll(() =>  {
        const datasource = makeSqliteDatasource()
        const commandBus = composeCommandBus(makeCommandStore(datasource), datasource)
        const eventPublisher = composeEventPublisher(makeEventStore(datasource))
        financeModule = makeFinanceModule({commandBus, eventPublisher})
    })

    it("create recurrence", async () => {

    })


})
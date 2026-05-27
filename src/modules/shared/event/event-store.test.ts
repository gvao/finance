import { beforeEach, describe, expect, it } from "vitest"
import type { EventRecord, EventStore } from "./types.js"
import type { Datasource } from "../../../infra/datasource/types.js"
import { makeSqliteDatasource } from "../../../infra/datasource/sqlite.datasource.js"
import { migrate } from "../../../infra/datasource/migrate.js"
import { makeEventStore, } from "./event-store.js"

describe("EventStore", () => {
    let eventStore: EventStore
    const mockAggregate = { id: crypto.randomUUID() }

    beforeEach(async () => {
        const datasource: Datasource = makeSqliteDatasource()
        await migrate(datasource)
        eventStore = makeEventStore(datasource)
        expect(await eventStore.getEvents()).toHaveLength(0)
    })

    it("appends events to the store", async () => {
        const event = buildEvent({ type: "TEST_EVENT", payload: { data: "test" }, aggregateId: mockAggregate.id, version: 1, commandId: crypto.randomUUID() })
        await eventStore.appendEvents(event)
        const events = await eventStore.getEvents()
        expect(events).toHaveLength(1)
        expect(events[0]?.id).toBe(event.id)
    })

    it("should return events between dates", async () => {
        const event1 = buildEvent({ type: "TEST_EVENT", payload: { data: "test1" }, aggregateId: mockAggregate.id, version: 1, commandId: crypto.randomUUID(), createdAt: new Date("2026-05-01T00:00:00Z") })
        const event2 = buildEvent({ type: "TEST_EVENT", payload: { data: "test2" }, aggregateId: mockAggregate.id, version: 2, commandId: crypto.randomUUID(), createdAt: new Date("2026-05-02T00:00:00Z") })
        const event3 = buildEvent({ type: "TEST_EVENT", payload: { data: "test3" }, aggregateId: mockAggregate.id, version: 3, commandId: crypto.randomUUID(), createdAt: new Date("2026-05-03T00:00:00Z") })
        await eventStore.appendEvents(event1, event2, event3)
        const events = await eventStore.getEvents({
            startDate: new Date("2026-05-02T00:00:00Z"),
            endDate: new Date("2026-05-31T23:59:59Z")
        })
        expect(events).toHaveLength(2)
        expect(events[0]?.id).toBe(event2.id)
        expect(events[1]?.id).toBe(event3.id)
    })

    it("should return events by aggregateId by start version", async () => {
        const type = "TEST_EVENT"
        const payload = { data: "test" }
        const event1 = buildEvent({ type, payload, aggregateId: mockAggregate.id, version: 1, commandId: crypto.randomUUID() })
        const event2 = buildEvent({ type, payload, aggregateId: mockAggregate.id, version: 2, commandId: crypto.randomUUID() })
        const event3 = buildEvent({ type, payload, aggregateId: "any_aggregate_id", version: 2, commandId: crypto.randomUUID() })
        const event4 = buildEvent({ type, payload, aggregateId: mockAggregate.id, version: 3, commandId: crypto.randomUUID() })
        await eventStore.appendEvents(event1, event2, event3, event4)
        const events = await eventStore.getEventsByAggregateId(mockAggregate.id, 2)
        expect(events).toHaveLength(2)
        expect(events[0]?.id).toBe(event2.id)
        expect(events[1]?.id).toBe(event4.id)
    })
})

const buildEvent = (overrides: Partial<EventRecord> & Pick<EventRecord, "type" | "payload" | "aggregateId" | "version" | "commandId">): EventRecord => ({
    id: crypto.randomUUID(),
    createdAt: new Date(),
    ...overrides
})
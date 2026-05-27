import { beforeEach, describe, expect, it } from "vitest"
import type { EventPublisher, EventRecord, EventStore, EventObserver } from "./types.js"
import type { Datasource } from "../../../infra/datasource/types.js"
import { makeSqliteDatasource } from "../../../infra/datasource/sqlite.datasource.js"
import { migrate } from "../../../infra/datasource/migrate.js"
import { buildEvent, composeEventPublisher, makeEventStore, } from "./event-store.js"

describe("EventStore", () => {
    let eventStore: ReturnType<typeof composeEventPublisher>
    const mockAggregate = { id: crypto.randomUUID() }

    beforeEach(async () => {
        const datasource: Datasource = makeSqliteDatasource()
        await migrate(datasource)
        eventStore = composeEventPublisher(makeEventStore(datasource))
        expect(await eventStore.getEvents()).toHaveLength(0)
    })

    it("should publish events to subscribers", () => {
        const event = buildEvent({ type: "TEST_EVENT", payload: { data: "test" }, aggregateId: mockAggregate.id, version: 1, commandId: crypto.randomUUID() })

        const listener: EventObserver = (...events) => {
            expect(events).toHaveLength(1)
            expect(events[0]?.type).toBe("TEST_EVENT")
        }
        eventStore.subscribe(listener)
        eventStore.publish(event)
        expect(eventStore.countListeners()).toBe(1)
        eventStore.unsubscribe(listener)
        expect(eventStore.countListeners()).toBe(0)
    })

    it("should publish events with methods like appendEvents", () => {
        const event = buildEvent({ type: "TEST_EVENT", payload: { data: "test" }, aggregateId: mockAggregate.id, version: 1, commandId: crypto.randomUUID() })

        const listener: EventObserver = (...events) => {
            expect(events).toHaveLength(1)
            expect(events[0]?.type).toBe("TEST_EVENT")
        }
        eventStore.subscribe(listener)
        eventStore.appendEvents(event)
    })

    it("appends events to the store", async () => {
        const event = buildEvent({ type: "TEST_EVENT", payload: { data: "test" }, aggregateId: mockAggregate.id, version: 1, commandId: crypto.randomUUID() })
        await eventStore.appendEvents(event)
        expect(await eventStore.getEvents()).toHaveLength(1)
    })

    it("retrieves events by aggregateId and version", async () => {
        const aggregateId = crypto.randomUUID()
        const event1 = buildEvent({ type: "E1", payload: {}, aggregateId, version: 1, commandId: crypto.randomUUID() })
        const event2 = buildEvent({ type: "E2", payload: {}, aggregateId, version: 2, commandId: crypto.randomUUID() })
        const event3 = buildEvent({ type: "E3", payload: {}, aggregateId: crypto.randomUUID(), version: 1, commandId: crypto.randomUUID() })

        await eventStore.appendEvents(event1, event2, event3)

        const events = await eventStore.getEventsByAggregateId(aggregateId, 1)
        expect(events).toHaveLength(2)
        expect(events[0]?.type).toBe("E1")
        expect(events[1]?.type).toBe("E2")

        const eventsFromVersion2 = await eventStore.getEventsByAggregateId(aggregateId, 2)
        expect(eventsFromVersion2).toHaveLength(1)
        expect(eventsFromVersion2[0]?.type).toBe("E2")
    })

    it("retrieves events within a date range", async () => {
        const event1 = buildEvent({ type: "E1", payload: {}, aggregateId: mockAggregate.id, version: 1, commandId: crypto.randomUUID() })
        event1.createdAt = new Date("2023-01-01T10:00:00Z")

        const event2 = buildEvent({ type: "E2", payload: {}, aggregateId: mockAggregate.id, version: 2, commandId: crypto.randomUUID() })
        event2.createdAt = new Date("2023-01-02T10:00:00Z")

        const event3 = buildEvent({ type: "E3", payload: {}, aggregateId: mockAggregate.id, version: 3, commandId: crypto.randomUUID() })
        event3.createdAt = new Date("2023-01-03T10:00:00Z")

        const event4 = buildEvent({ type: "E4", payload: {}, aggregateId: mockAggregate.id, version: 4, commandId: crypto.randomUUID() })
        event4.createdAt = new Date("2023-01-04T10:00:00Z")

        await eventStore.appendEvents(event1, event2, event3, event4)

        const events = await eventStore.getEvents({
            startDate: new Date("2023-01-02T00:00:00Z"),
            endDate: new Date("2023-01-04T00:00:00Z")
        })

        expect(events).toHaveLength(2)
        expect(events[0]?.id).toBe(event2.id)
        expect(events[1]?.id).toBe(event3.id)
    })
})

import type { EventPublisher, EventRecord, EventRow, EventStore, EventObserver } from "./types.js"
import type { Datasource } from "../../../infra/datasource/types.js"


export const buildEvent = (overrides: Partial<EventRecord> & Pick<EventRecord, "type" | "payload" | "aggregateId" | "version" | "commandId">): EventRecord => ({
    id: crypto.randomUUID(),
    createdAt: new Date(),
    ...overrides
})

const mapRowToEvent = (row: EventRow): EventRecord => buildEvent({
    id: row.id,
    type: row.type,
    payload: JSON.parse(row.payload),
    aggregateId: row.aggregate_id,
    version: row.version,
    commandId: row.command_id,
    createdAt: new Date(row.created_at)
})

const mapEventToRow = (event: EventRecord): EventRow => ({
    id: event.id,
    type: event.type,
    payload: JSON.stringify(event.payload),
    aggregate_id: event.aggregateId,
    version: event.version,
    command_id: event.commandId,
    created_at: event.createdAt.toISOString()
})

export function makeEventStore(datasource: Datasource) {
    return {
        getEvents: async ({ endDate = new Date(), startDate }: { startDate?: Date, endDate?: Date } = { endDate: new Date() }): Promise<EventRecord[]> => {
            if (!startDate) {
                const defaultStartDate = new Date(endDate)
                defaultStartDate.setDate(defaultStartDate.getDate() - 30)
                startDate = defaultStartDate
            }
            if (startDate > endDate) throw new Error("startDate cannot be greater than endDate")

            const rows = await datasource.query(
                "SELECT * FROM events WHERE created_at >= ? AND created_at <= ? ORDER BY created_at ASC",
                [startDate.toISOString(), endDate.toISOString()]
            ) as EventRow[]

            return rows.map(mapRowToEvent)
        },

        appendEvents: async (...newEvents: EventRecord[]) => {
            await datasource.unitOfWork(async (tx) => {
                for (const event of newEvents) {
                    const row = mapEventToRow(event)
                    const columns = Object.keys(row)
                    const values = Object.values(row)
                    const placeholders = columns.map(() => "?").join(", ")

                    const statement = `INSERT INTO events (${columns.join(", ")}) VALUES (${placeholders})`
                    await tx.run(statement, values)
                }
            })
        },

        getEventsByAggregateId: async (aggregateId: string, startVersion: number = 1): Promise<EventRecord[]> => {
            const rows = await datasource.query(`
                SELECT * FROM events 
                WHERE aggregate_id = ?
                AND version >= ?
                ORDER BY version ASC
            `, [aggregateId, startVersion]) as EventRow[]

            return rows.map(mapRowToEvent)
        }
    }
}

export function composeEventPublisher(eventStore: EventStore): { countListeners: () => number } & EventStore & EventPublisher {
    const listeners: Set<EventObserver> = new Set()
    return {
        ...eventStore,

        countListeners: () => listeners.size,

        async appendEvents(...newEvents) {
            await eventStore.appendEvents(...newEvents)
            this.publish(...newEvents)
            return
        },

        publish(...events: EventRecord[]) {
            for (const event of events) {
                listeners.forEach(listener => listener(event))
            }

            return
        },
        subscribe(listener: EventObserver) {
            listeners.add(listener)
        },
        unsubscribe(listener: EventObserver) {
            listeners.delete(listener)
        }
    }
}

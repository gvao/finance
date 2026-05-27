export type EventRecord = {
    id: string;
    aggregateId: string;
    version: number;
    commandId: string;
    type: string;
    payload: Record<string, unknown>;
    createdAt: Date;
}

export type EventRow = {
    id: string
    type: string
    payload: string
    aggregate_id: string
    version: number
    command_id: string
    created_at: string
}

export interface EventStore {
    getEvents: ({ endDate, startDate }?: {
        startDate?: Date;
        endDate?: Date;
    }) => Promise<EventRecord[]>;
    appendEvents: (...newEvents: EventRecord[]) => Promise<void>;
    getEventsByAggregateId: (aggregateId: string, startVersion: number) => Promise<EventRecord[]>;
}

export type EventListener = (...events: EventRecord[]) => void;
export interface EventPublisher {
    publish(events: EventRecord[]): Promise<void>;
    subscribe(listener: EventListener): void;
    unsubscribe(listener: EventListener): void;
}

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
    getEvents: (option?: { startDate?: Date; endDate?: Date; }) => Promise<EventRecord[]>;
    appendEvents: (...newEvents: EventRecord[]) => Promise<void>;
    getEventsByAggregateId: (aggregateId: string, startVersion: number) => Promise<EventRecord[]>;
}

export type EventObserver = (...events: EventRecord[]) => void;
export interface EventPublisher {
    publish(...events: EventRecord[]): void;
    subscribe(listener: EventObserver): void;
    unsubscribe(listener: EventObserver): void;
}

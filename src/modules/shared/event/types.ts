export type EventRecord = {
    type: string;
    payload: Record<string, unknown>;
}

export type EventListener = (...events: EventRecord[]) => void;

export interface EventPublisher {
    publish(events: EventRecord[]): Promise<void>;
    subscribe(listener: EventListener): void;
    unsubscribe(listener: EventListener): void;
}
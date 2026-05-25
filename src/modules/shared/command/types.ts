import type { EventRecord } from "../event/types.js";

export type Command = {
    id: string;
    aggregateId: string;
    type: string;
    status: "pending" | "processed" | "failed";
    createdAt: Date;
    updatedAt: Date;
    data: Record<string, any>;
}

export type CommandCreateDto = Omit<Command, "id" | "status" | "createdAt" | "updatedAt">
export type CommandOptionalCreateDto = Partial<Pick<Command, "id" | "status" | "createdAt" | "updatedAt">>
export type CommandBuilderDto = CommandCreateDto & CommandOptionalCreateDto

export type CommandHandler = (type: Command["type"], command: Command) => Promise<EventRecord[]>;

export interface CommandBus {
    handle(commandType: Command["type"], command: Command): Promise<EventRecord[]>;
    register(commandType: Command["type"], handler: CommandHandler): void
}


export interface CommandStore {
    getCommands(): Promise<Command[]>;
    appendCommand(command: Command): Promise<[{ commandId: string }, EventRecord[]]>;
    getCommandsByAggregateId(aggregateId: string): Promise<Command[]>;
    getCommandById(id: string): Promise<Command>;
    getPending(): Promise<Command[]>;
    markAsProcessed(id: string): Promise<void>;
    markAsFailed(id: string): Promise<void>;
}

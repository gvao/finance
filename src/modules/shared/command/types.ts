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
    dispatch(commandType: Command["type"], handler: CommandHandler): Promise<void>;
    register(commandType: Command["type"], handler: CommandHandler): void
}


export interface CommandStore {
    getCommands(): Promise<Command[]>;
    appendCommand(command: Command): Promise<{ commandId: string }>;
    getCommandsByAggregateId(aggregateId: string): Promise<Command[]>;
    getPending(): Promise<Command[]>;
    processedCommand(id: string): Promise<void>;
    failedCommand(id: string): Promise<void>;
}

import type { CommandHandler, CommandBus } from "./command/types.js";
import type { EventPublisher } from "./event/types.js";

export interface Module {
    name: string;
    handlers: Record<string, CommandHandler>
}

export type Dependencies = {
    commandBus: CommandBus,
    eventPublisher: EventPublisher,
}

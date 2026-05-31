import type { Command } from "../shared/command/types.js";
import { buildEvent } from "../shared/event/event-store.js";
import type { Dependencies, Module } from "../shared/module.type.js";

export function makeFinanceModule(dependencies: Pick<Dependencies, "eventPublisher">): Module {

    const commandsExpected = {
        "create-recurrence": 
    }

    return {
        name: "finance",
        handlers: {
            "create-recurrence": async (command: Command) => {
                dependencies
                const event = buildEvent({ aggregateId: command.aggregateId, type: "recurrence-created", payload: {}, commandId: command.id, version: 1  })
                
                return [event]
            }
        },
    }
}
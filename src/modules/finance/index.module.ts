import type { UUID } from "node:crypto";
import type { Command, CommandHandler } from "../shared/command/types.js";
import { buildEvent, makeEventStore } from "../shared/event/event-store.js";
import type { Dependencies, Module } from "../shared/module.type.js";
import type { Aggregate } from "../shared/aggregate/type.js";

export type Recurrence = Aggregate & {
    weekDays: number[],
}

export function makeFinanceModule({ datasource }: Pick<Dependencies, "datasource">): Module {
    const { getEventsByAggregateId } = makeEventStore(datasource)

    const name = "finance"

    const commands = {
        "create-recurrence": async (type: string, command: Command) => {
            const events = await getEventsByAggregateId(command.aggregateId)

            const event = buildEvent({ type: "finance:recurrence-created", aggregateId: command.aggregateId, commandId: command.id, payload: {}, version: events.length + 1 })
            return [event]
        },
        "update-recurrence": async (type: string, command: Command) => {
            return []
        }
    }

    return {
        name,
        commands,
    }
}
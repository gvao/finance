import type { Command } from "../command/types.js"
import type { EventRecord } from "../event/types.js"
import type { Decide, Aggregate, Apply } from "./type.js"

export const makeDecide = (decides: Record<string, Decide>) => {
    return (state: Aggregate, command: Command<any>): EventRecord[] => {
        const decide = decides[command.type]
        if (!decide) {
            throw new Error("Unknown command type: " + command.type)
        }
        return decide(state, command)
    }
}

export const makeReplay = <T extends Aggregate>(applys: Record<string, Apply<T>>) => {

    return (events: EventRecord[], state: T): T => {
        for (const event of events) {
            const apply = applys[event.type]!
            state = apply(state, event)
        }
        return state
    }
}
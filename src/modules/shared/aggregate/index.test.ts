import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { Aggregate, Apply, Decide } from "./type.js";
import type { EventRecord } from "../event/types.js";
import { buildEvent } from "../event/event-store.js";
import type { Command } from "../command/types.js";
import { buildCommand } from "../command/command-store.js";
import { makeDecide, makeReplay } from "./index.js";

describe("Aggregate", () => {
    type Test = Aggregate & {
        amount: number
    }

    const aggregateId = randomUUID()

    it("replay", async () => {
        const eventApply = {
            "test:increament": (state: Test, event: { payload: Partial<Test> }): Test => {
                const multiplyBase = 100_000_000
                const currentMount = state.amount * multiplyBase
                const newMount = event.payload?.amount! * multiplyBase
                return {
                    ...state,
                    amount: (currentMount + newMount) / multiplyBase
                }
            }
        }
        const replay = makeReplay<Test>(eventApply)

        const events: EventRecord[] = [
            buildEvent({ type: 'test:increament', payload: { amount: 100.1 }, aggregateId, commandId: randomUUID(), version: 1 }),
            buildEvent({ type: 'test:increament', payload: { amount: 200.2 }, aggregateId, commandId: randomUUID(), version: 1 }),
        ]
        const state = { amount: 0, id: aggregateId }
        const newState = replay(events, state)
        expect(newState.amount).toEqual(300.3)
    })

    it("decide", () => {
        const command: Command<any> = buildCommand({ type: "test:increament", aggregateId, data: { amount: 100.1 }, })


        const decides: Record<string, Decide> = {
            "test:increament": (state, command) => {
                const event = buildEvent({ type: "test:increament", payload: { amount: 100.1 }, aggregateId, commandId: command.id, version: 1 })

                return [event]
            }

        }

        const decide: Decide = makeDecide(decides)

        const initialState = { version: 0, id: aggregateId }

        const events = decide(initialState, command)

        expect(events).toHaveLength(1)
        const event = events[0]
        expect(event?.type).toEqual("test:increament")
        expect(event?.payload.amount).toEqual(100.1)
        expect(event?.aggregateId).toEqual(aggregateId)
        expect(event?.commandId).toEqual(command.id)
        expect(event?.version).toEqual(1)
    })
})

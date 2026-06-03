import type { UUID } from "node:crypto"
import type { EventRecord } from "../event/types.js"
import type { Command } from "../command/types.js"

export type Aggregate = {
    id: UUID
}

export type Apply<T extends Aggregate = Aggregate> = (state: T, event: EventRecord) => T

export type Decide = (state: Aggregate, command: Command<any>) => EventRecord[]
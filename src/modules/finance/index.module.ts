import type { Dependencies, Module } from "../shared/module.type.js";

export function makeFinanceModule(dependencies: Dependencies): Module {

    return {
        name: "finance",
        handlers: {},
    }
}
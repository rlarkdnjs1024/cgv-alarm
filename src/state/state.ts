import {readFile, writeFile} from "node:fs/promises";

const STATE_FILE = "./state.json";

export type State  = {
    lastOpenDate: string,
}


export async function readState() {
    try {
        const text = await readFile(STATE_FILE, "utf-8");
        return JSON.parse(text) as State;
    } catch {
        return null;
    }
}

export async function writeState(state: State) {
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2))
}
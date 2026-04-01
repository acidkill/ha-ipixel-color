import { makeCommandPayload } from './commands';

// Mocked/reverse-engineered command logic for advanced stuff that pypixelcolor did
// Ideally, we'll implement a TypeScript equivalent of pypixelcolor here or import it if ported.

export function makeClockModeCommand(style: number = 1, showDate: boolean = true, format24: boolean = true): Buffer {
    // Scaffolded for now. Need to determine the byte layout for clock modes.
    // Example layout from pypixelcolor:
    // Opcode 0x8010 or similar?
    // This will need actual TS reimplementation of pypixelcolor protocols.
    // For scaffolding, returning an empty buffer which needs to be replaced later.
    return Buffer.from([]);
}

export function makeTimeCommand(hour?: number, minute?: number, second?: number): Buffer {
    const now = new Date();
    const h = hour ?? now.getHours();
    const m = minute ?? now.getMinutes();
    const s = second ?? now.getSeconds();

    // Command opcode is typically 0x8008 or similar for time, using pypixelcolor format.
    // Scaffolded for now.
    return Buffer.from([]);
}

export function makeTextCommand(text: string, colorHex: string, bgColorHex: string | null): Buffer[] {
    // Scaffolded for now
    return [Buffer.from([])];
}

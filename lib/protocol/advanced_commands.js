"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeClockModeCommand = makeClockModeCommand;
exports.makeTimeCommand = makeTimeCommand;
exports.makeTextCommand = makeTextCommand;
// Mocked/reverse-engineered command logic for advanced stuff that pypixelcolor did
// Ideally, we'll implement a TypeScript equivalent of pypixelcolor here or import it if ported.
function makeClockModeCommand(style = 1, showDate = true, format24 = true) {
    // Scaffolded for now. Need to determine the byte layout for clock modes.
    // Example layout from pypixelcolor:
    // Opcode 0x8010 or similar?
    // This will need actual TS reimplementation of pypixelcolor protocols.
    // For scaffolding, returning an empty buffer which needs to be replaced later.
    return Buffer.from([]);
}
function makeTimeCommand(hour, minute, second) {
    const now = new Date();
    const h = hour ?? now.getHours();
    const m = minute ?? now.getMinutes();
    const s = second ?? now.getSeconds();
    // Command opcode is typically 0x8008 or similar for time, using pypixelcolor format.
    // Scaffolded for now.
    return Buffer.from([]);
}
function makeTextCommand(text, colorHex, bgColorHex) {
    // Scaffolded for now
    return [Buffer.from([])];
}

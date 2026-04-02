import { makeCommandPayload } from './commands';

/**
 * Configure clock display (Opcode: 0x0106)
 * [0x0B, 0x00, 0x06, 0x01, style, is_24h, show_date, year, month, day, weekday]
 */
export function makeClockModeCommand(style: number = 1, showDate: boolean = true, format24: boolean = true): Buffer {
    const now = new Date();
    const year = now.getFullYear() % 100; // Protocol usually takes 2-digit year
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekday = now.getDay() === 0 ? 7 : now.getDay(); // Usually 1-7 for Mon-Sun

    return makeCommandPayload(0x0106, [
        style,
        format24 ? 1 : 0,
        showDate ? 1 : 0,
        year,
        month,
        day,
        weekday
    ]);
}

/**
 * Set current time (Opcode: 0x8001)
 * [0x08, 0x00, 0x01, 0x80, hour, minute, second, 0x00]
 */
export function makeTimeCommand(hour?: number, minute?: number, second?: number): Buffer {
    const now = new Date();
    const h = hour ?? now.getHours();
    const m = minute ?? now.getMinutes();
    const s = second ?? now.getSeconds();

    return makeCommandPayload(0x8001, [h, m, s, 0x00]);
}

/**
 * Enable DIY drawing mode (Opcode: 0x0104)
 */
export function makeDIYModeCommand(enabled: boolean): Buffer {
    return makeCommandPayload(0x0104, [enabled ? 1 : 0]);
}

/**
 * Set Individual Pixel (Opcode: 0x0105)
 * [R, G, B, A, X, Y]
 */
export function makeSetPixelCommand(x: number, y: number, r: number, g: number, b: number, a: number = 255): Buffer {
    return makeCommandPayload(0x0105, [r, g, b, a, x, y]);
}

/**
 * Select Screen / Buffer (Opcode: 0x8007)
 */
export function makeSelectScreenCommand(screenNumber: number): Buffer {
    const screen = Math.max(1, Math.min(9, screenNumber));
    return makeCommandPayload(0x8007, [screen]);
}

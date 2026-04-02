"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFY_UUID = exports.WRITE_UUID = void 0;
exports.makeCommandPayload = makeCommandPayload;
exports.makePowerCommand = makePowerCommand;
exports.makeBrightnessCommand = makeBrightnessCommand;
exports.buildDeviceInfoCommand = buildDeviceInfoCommand;
exports.parseDeviceResponse = parseDeviceResponse;
exports.WRITE_UUID = '0000fa02-0000-1000-8000-00805f9b34fb';
exports.NOTIFY_UUID = '0000fa03-0000-1000-8000-00805f9b34fb';
function makeCommandPayload(opcode, payload) {
    const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
    const totalLength = payloadBuffer.length + 4; // +4 for length and opcode
    const command = Buffer.alloc(totalLength);
    // Length (little-endian)
    command.writeUInt16LE(totalLength, 0);
    // Opcode (little-endian)
    command.writeUInt16LE(opcode, 2);
    // Payload
    payloadBuffer.copy(command, 4);
    return command;
}
function makePowerCommand(on) {
    // Command format from protocol documentation:
    // [5, 0, 7, 1, on_byte] where on_byte = 1 for on, 0 for off
    const onByte = on ? 1 : 0;
    return Buffer.from([5, 0, 7, 1, onByte]);
}
function makeBrightnessCommand(brightness) {
    if (brightness < 1 || brightness > 100) {
        throw new Error('Brightness must be between 1 and 100');
    }
    return makeCommandPayload(0x8004, [brightness]);
}
function buildDeviceInfoCommand() {
    // from pypixelcolor internal_commands.py
    return Buffer.from([0x04, 0x00, 0x01, 0x80]);
}
function parseDeviceResponse(response) {
    // We'll provide a simplified parser or placeholder based on the protocol
    // if pypixelcolor's implementation is complex.
    // For basic devices, width/height is usually derived from deviceType.
    // Assume generic values or mock parsing for scaffolding
    return {
        width: 64,
        height: 16,
        deviceType: 0,
        ledType: 0,
        mcuVersion: '1.0.0',
        wifiVersion: '0.0.0',
        hasWifi: false,
        passwordFlag: 255,
    };
}

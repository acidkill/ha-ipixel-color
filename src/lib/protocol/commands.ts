export const SERVICE_UUID = '0000fa00-0000-1000-8000-00805f9b34fb';
export const WRITE_UUID = '0000fa02-0000-1000-8000-00805f9b34fb';
export const NOTIFY_UUID = '0000fa03-0000-1000-8000-00805f9b34fb';

export function makeCommandPayload(opcode: number, payload: number[] | Buffer): Buffer {
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

export function makePowerCommand(on: boolean): Buffer {
  // Command format from protocol documentation:
  // [5, 0, 7, 1, on_byte] where on_byte = 1 for on, 0 for off
  const onByte = on ? 1 : 0;
  return Buffer.from([5, 0, 7, 1, onByte]);
}

export function makeBrightnessCommand(brightness: number): Buffer {
  if (brightness < 1 || brightness > 100) {
    throw new Error('Brightness must be between 1 and 100');
  }
  return makeCommandPayload(0x8004, [brightness]);
}

export function buildDeviceInfoCommand(): Buffer {
  // from pypixelcolor internal_commands.py
  return Buffer.from([0x04, 0x00, 0x01, 0x80]);
}

export interface DeviceInfo {
  width: number;
  height: number;
  deviceType: number;
  ledType: number;
  mcuVersion: string;
  wifiVersion: string;
  hasWifi: boolean;
  passwordFlag: number;
}

export function parseDeviceResponse(response: Buffer): DeviceInfo {
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

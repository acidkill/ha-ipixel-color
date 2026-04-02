import * as zlib from 'zlib';

/**
 * Builds the data payload for Opcode 0x0002 (PNG Data) and Opcode 0x0003 (GIF Data)
 * It matches the protocol pattern:
 * [LenLow, LenHigh, OpcodeLow, OpcodeHigh, 0x00, SizeLow, ..., CRCLow, ..., 0x00, BufferNumber, Data...]
 */
export function buildMediaCommand(opcode: number, mediaData: Buffer, bufferNumber: number): Buffer {
    const size = mediaData.length;
    // We compute a 32-bit CRC. In Node, zlib.crc32 gives an unsigned 32-bit integer.
    const crc = zlib.crc32(mediaData);

    // Calculate metadata header length:
    // 1 byte reserved (0x00)
    // 4 bytes for size (Uint32LE)
    // 4 bytes for CRC32 (Uint32LE)
    // 1 byte reserved (0x00)
    // 1 byte for bufferNumber
    // Total = 11 bytes metadata payload (+4 bytes standard header)
    const totalLength = 11 + size + 4; // +4 is for length + opcode from standard header

    const command = Buffer.alloc(totalLength);

    // Header (Standard)
    command.writeUInt16LE(totalLength, 0);
    command.writeUInt16LE(opcode, 2);

    // Metadata Payload
    command.writeUInt8(0x00, 4); // Reserved
    command.writeUInt32LE(size, 5); // Media size
    command.writeUInt32LE(crc, 9);  // CRC32
    command.writeUInt8(0x00, 13); // Reserved
    command.writeUInt8(bufferNumber, 14); // Buffer number (typically 1-9)

    // Data Payload
    mediaData.copy(command, 15);

    return command;
}

export function makePNGCommand(pngData: Buffer, bufferNumber: number = 1): Buffer {
    return buildMediaCommand(0x0002, pngData, bufferNumber);
}

export function makeGIFCommand(gifData: Buffer, bufferNumber: number = 1): Buffer {
    return buildMediaCommand(0x0003, gifData, bufferNumber);
}

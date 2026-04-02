"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const homey_1 = __importDefault(require("homey"));
class iPIXELColorDriver extends homey_1.default.Driver {
    async onInit() {
        this.log('iPIXEL Color Driver has been initialized');
    }
    async onPairListDevices() {
        this.log('Searching for iPIXEL devices...');
        const devices = [];
        try {
            // Find BLE devices
            const bleDiscovery = await this.homey.ble.discover();
            for (const peripheral of bleDiscovery) {
                if (peripheral.localName && peripheral.localName.startsWith('LED_BLE_')) {
                    devices.push({
                        name: peripheral.localName,
                        data: {
                            id: peripheral.uuid, // Use UUID for Homey
                            name: peripheral.localName,
                            uuid: peripheral.uuid,
                        },
                        settings: {
                            address: peripheral.address || peripheral.uuid, // Keep address for backward compatibility if possible
                        },
                    });
                }
            }
        }
        catch (error) {
            this.error('Error discovering BLE devices:', error);
        }
        return devices;
    }
}
module.exports = iPIXELColorDriver;

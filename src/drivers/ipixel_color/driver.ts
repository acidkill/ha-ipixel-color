import Homey from 'homey';

class iPIXELColorDriver extends Homey.Driver {
  async onInit() {
    this.log('iPIXEL Color Driver has been initialized');
  }

  async onPairListDevices() {
    this.log('Searching for iPIXEL devices...');
    const devices: {
      name: string;
      data: { id: string; name: string; uuid: string };
      settings: { address: string };
    }[] = [];

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
    } catch (error) {
      this.error('Error discovering BLE devices:', error);
    }

    return devices;
  }
}

export = iPIXELColorDriver;

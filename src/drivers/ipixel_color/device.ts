import Homey from 'homey';
import {
  WRITE_UUID,
  NOTIFY_UUID,
  makePowerCommand,
  makeBrightnessCommand
} from '../../lib/protocol/commands';

const SERVICE_UUID = '0000fa00-0000-1000-8000-00805f9b34fb';

class iPIXELColorDevice extends Homey.Device {
  private blePeripheral: any = null;
  private isConnected: boolean = false;
  private writeCharacteristic: any = null;

  async onInit() {
    this.log(`iPIXEL Color Device ${this.getName()} has been initialized`);

    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    this.registerCapabilityListener('light_hue', this.onCapabilityHue.bind(this));
    this.registerCapabilityListener('light_saturation', this.onCapabilitySaturation.bind(this));

    // Connect to the device to initialize it
    await this.connect();
  }

  async connect() {
    try {
      const address = this.getSetting('address');
      const uuid = this.getData().uuid;

      this.log(`Attempting to connect to ${uuid}...`);

      this.blePeripheral = await this.homey.ble.find(uuid);
      if (this.blePeripheral) {
        await this.blePeripheral.connect();
        this.isConnected = true;
        this.log('Connected successfully!');

        // Discover services and characteristics if needed
        const services = await this.blePeripheral.discoverServices();

        // Typically you'll find the service and save the characteristic references
        this.writeCharacteristic = await this.blePeripheral.getCharacteristic(SERVICE_UUID, WRITE_UUID);

        if (this.writeCharacteristic) {
          this.log('Found and cached write characteristic');
        } else {
          this.error('Failed to cache write characteristic');
        }

        // Listen to disconnect event
        this.blePeripheral.on('disconnect', () => {
          this.log('Disconnected');
          this.isConnected = false;
          this.writeCharacteristic = null;
        });

      } else {
        this.log('Device not found via BLE.');
      }
    } catch (error) {
      this.error('Error connecting:', error);
      this.isConnected = false;
    }
  }

  async onCapabilityOnoff(value: boolean, opts: any) {
    this.log('Capability onoff set to', value);
    if (!this.isConnected) {
      await this.connect();
    }

    if (this.isConnected) {
      const cmd = makePowerCommand(value);
      await this.sendCommand(cmd);
    }
  }

  async onCapabilityDim(value: number, opts: any) {
    this.log('Capability dim set to', value); // 0.0 - 1.0
    if (!this.isConnected) {
      await this.connect();
    }

    if (this.isConnected) {
      const brightness = Math.max(1, Math.round(value * 100));
      const cmd = makeBrightnessCommand(brightness);
      await this.sendCommand(cmd);
    }
  }

  async onCapabilityHue(value: number, opts: any) {
    this.log('Capability light_hue set to', value); // 0.0 - 1.0
    // To be implemented: translate HSV to RGB and set color text/bg command
  }

  async onCapabilitySaturation(value: number, opts: any) {
    this.log('Capability light_saturation set to', value); // 0.0 - 1.0
    // To be implemented
  }

  async sendCommand(buffer: Buffer) {
    try {
      if (this.blePeripheral && this.isConnected) {
        // You would typically get the specific service and write characteristic here
        // This is a placeholder for the actual Homey BLE API write
        this.log('Sending command:', buffer.toString('hex'));

        let writeChar = this.writeCharacteristic;
        if (!writeChar) {
          writeChar = await this.blePeripheral.getCharacteristic(SERVICE_UUID, WRITE_UUID);
          this.writeCharacteristic = writeChar; // Cache it if we found it
        }

        if (writeChar) {
          await writeChar.write(buffer);
        } else {
          this.error('Write characteristic not found');
        }
      }
    } catch (error) {
      this.error('Error sending command:', error);
    }
  }

  async onDeleted() {
    this.log('Device deleted');
    if (this.blePeripheral && this.isConnected) {
      await this.blePeripheral.disconnect();
    }
  }
}

export = iPIXELColorDevice;

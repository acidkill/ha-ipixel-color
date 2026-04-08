import Homey from 'homey';
import {
  SERVICE_UUID,
  WRITE_UUID,
  NOTIFY_UUID,
  makePowerCommand,
  makeBrightnessCommand
} from '../../lib/protocol/commands';

class iPIXELColorDevice extends Homey.Device {
  private blePeripheral: any = null;
  private writeChar: any = null;
  private isConnected: boolean = false;

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
        await this.blePeripheral.discoverServices();
        this.writeChar = await this.blePeripheral.getCharacteristic(SERVICE_UUID, WRITE_UUID);

        if (!this.writeChar) {
          this.error('Write characteristic not found');
        }

        // Listen to disconnect event
        this.blePeripheral.on('disconnect', () => {
          this.log('Disconnected');
          this.isConnected = false;
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
      if (this.blePeripheral && this.isConnected && this.writeChar) {
        this.log('Sending command:', buffer.toString('hex'));
        await this.writeChar.write(buffer);
      } else if (this.isConnected && !this.writeChar) {
        this.error('Cannot send command: Write characteristic not initialized');
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

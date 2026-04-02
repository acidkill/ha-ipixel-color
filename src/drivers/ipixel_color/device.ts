import Homey from 'homey';
import {
  WRITE_UUID,
  NOTIFY_UUID,
  makePowerCommand,
  makeBrightnessCommand
} from '../../lib/protocol/commands';
import {
  makeClockModeCommand,
  makeTimeCommand
} from '../../lib/protocol/advanced_commands';

class iPIXELColorDevice extends Homey.Device {
  private blePeripheral: any = null;
  private isConnected: boolean = false;
  private currentHue: number = 0;
  private currentSaturation: number = 0;
  private currentDim: number = 1.0;

  async onInit() {
    this.log(`iPIXEL Color Device ${this.getName()} has been initialized`);

    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    this.registerCapabilityListener('light_hue', this.onCapabilityHue.bind(this));
    this.registerCapabilityListener('light_saturation', this.onCapabilitySaturation.bind(this));
    this.registerCapabilityListener('ipixel_mode', this.onCapabilityMode.bind(this));
    this.registerCapabilityListener('ipixel_text', this.onCapabilityText.bind(this));
    this.registerCapabilityListener('ipixel_clock_style', this.onCapabilityClockStyle.bind(this));

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
    this.currentDim = value;
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
    this.currentHue = value;
    await this.updateColor();
  }

  async onCapabilitySaturation(value: number, opts: any) {
    this.log('Capability light_saturation set to', value); // 0.0 - 1.0
    this.currentSaturation = value;
    await this.updateColor();
  }

  async updateColor() {
    // Converts HSV to RGB if we implement text image rendering from Homey later.
    // For now, logged.
    this.log(`Color updated: Hue=${this.currentHue}, Sat=${this.currentSaturation}`);
  }

  async onCapabilityMode(value: string, opts: any) {
    this.log('Capability ipixel_mode set to', value);
    if (!this.isConnected) {
      await this.connect();
    }

    if (this.isConnected && value === 'clock') {
      const style = this.getStoreValue('ipixel_clock_style') || 1;
      const timeCmd = makeTimeCommand();
      await this.sendCommand(timeCmd);

      const clockCmd = makeClockModeCommand(style, true, true);
      await this.sendCommand(clockCmd);
    }
  }

  async onCapabilityText(value: string, opts: any) {
    this.log('Capability ipixel_text set to', value);
    // Requires TS PNG renderer implementation to build the byte buffers.
    // To be implemented fully in the text renderer module in the future.
  }

  async onCapabilityClockStyle(value: number, opts: any) {
    this.log('Capability ipixel_clock_style set to', value);
    const mode = this.getStoreValue('ipixel_mode');

    if (mode === 'clock' && this.isConnected) {
      const clockCmd = makeClockModeCommand(value, true, true);
      await this.sendCommand(clockCmd);
    }
  }

  async sendCommand(buffer: Buffer) {
    try {
      if (this.blePeripheral && this.isConnected) {
        this.log('Sending command:', buffer.toString('hex'));

        const serviceUuid = '0000fa00-0000-1000-8000-00805f9b34fb'; // Typically the parent service
        const writeChar = await this.blePeripheral.getCharacteristic(serviceUuid, WRITE_UUID);

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

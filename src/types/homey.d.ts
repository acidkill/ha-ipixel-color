declare module 'homey' {
  export class App {
    log(...args: any[]): void;
    error(...args: any[]): void;
    onInit(): Promise<void>;
  }

  export class Device {
    homey: any;
    log(...args: any[]): void;
    error(...args: any[]): void;
    onInit(): Promise<void>;
    onDeleted(): Promise<void>;
    getName(): string;
    getSetting(key: string): any;
    getData(): any;
    getStoreValue(key: string): any;
    registerCapabilityListener(capabilityId: string, listener: (value: any, opts: any) => Promise<void>): void;
  }

  export class Driver {
    homey: any;
    log(...args: any[]): void;
    error(...args: any[]): void;
    onInit(): Promise<void>;
    onPairListDevices(): Promise<any[]>;
  }

  const Homey: {
    App: typeof App;
    Device: typeof Device;
    Driver: typeof Driver;
  };

  export default Homey;
}

export declare const DataCodes: {
  readonly Connected: string;
  readonly Disconnected: string;
  readonly BoardInfo: string;
  readonly DeviceName: string;
  readonly DeviceFWVersion: string;
  readonly DeviceHWVersion: string;
  readonly ResponseDisplayLineAck: string;
  readonly ResponseDisplayLineComplete: string;
};

export declare const KeyCodes: {
  readonly KeyFunction1: string;
  readonly KeyFunction2: string;
  readonly KeyFunction3: string;
  readonly KeyFunction4: string;
  readonly PanningLeft: string;
  readonly PanningRight: string;
  readonly PanningAll: string;
  readonly LPF1: string;
  readonly RPF4: string;
  readonly KeyElse: string;
};

export declare const DisplayMode: {
  readonly GraphicMode: string;
  readonly TextMode: string;
};

export declare const DeviceInfo: {
  readonly DeviceName: string;
  readonly FirmwareVersion: string;
  readonly HardwareVersion: string;
};

export declare class DotDevice {
  get isConnect(): boolean;
  get numberCellRows(): number;
  get numberCellColumns(): number;
  get numberBrailleCellColumns(): number;
  displayGraphicData(data: string, lineStart?: number, cellStart?: number, mode?: string): void;
  displayTextData(data: string, cellStart?: number, mode?: string): void;
  displayLineData(lineId: number, cellStart: number, data: string, mode?: string): void;
  requestDeviceInfo(info: string): Promise<void>;
  disconnect(): Promise<void>;
}

export declare class DotPadScanner {
  readonly DOTPAD_SERVICE: string;
  startBleScan(): Promise<BluetoothDevice | undefined>;
  startUsbScan(): Promise<SerialPort | undefined>;
}

export declare class DotPadSDK {
  getConnectedDevices(): DotDevice[];
  connectBleDevice(device: BluetoothDevice): Promise<DotDevice | null>;
  connectUsbDevice(port: SerialPort): Promise<DotDevice | null>;
  disconnect(device?: DotDevice | null): void;
  displayGraphicData(data: string, device?: DotDevice | null, mode?: string): void;
  displayTextData(data: string, device?: DotDevice | null, mode?: string): void;
  displayAllUp(device?: DotDevice | null): void;
  displayAllDown(device?: DotDevice | null): void;
  setCallBack(
    messageCallback: (device: DotDevice, code: string, data: string) => void,
    keyCallback: (device: DotDevice, key: string, raw: string) => void,
  ): void;
}

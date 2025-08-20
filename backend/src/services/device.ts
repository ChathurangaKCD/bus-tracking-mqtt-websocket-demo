import { DeviceData } from './mqtt';

export interface Device {
  id: string;
  name: string;
  lastSeen?: string;
  status: 'online' | 'offline' | 'maintenance';
  lastData?: DeviceData;
}

export class DeviceService {
  private devices: Map<string, Device> = new Map();
  private deviceDataCache: Map<string, DeviceData> = new Map();

  constructor() {
    this.initializeDevices();
  }

  private initializeDevices(): void {
    for (let i = 1; i <= 50; i++) {
      const deviceId = `Bus-${i}`;
      this.devices.set(deviceId, {
        id: deviceId,
        name: `Bus ${i}`,
        status: 'offline'
      });
    }
    console.log('🚌 Initialized 50 bus devices');
  }

  getAllDevices(): Device[] {
    return Array.from(this.devices.values())
      .sort((a, b) => {
        const aNum = parseInt(a.id.split('-')[1]);
        const bNum = parseInt(b.id.split('-')[1]);
        return aNum - bNum;
      });
  }

  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  getOnlineDevices(): Device[] {
    return this.getAllDevices().filter(device => device.status === 'online');
  }

  updateDeviceData(deviceId: string, data: DeviceData): void {
    const device = this.devices.get(deviceId);
    if (!device) {
      console.warn(`⚠️ Unknown device: ${deviceId}`);
      return;
    }

    const now = new Date().toISOString();
    
    device.lastSeen = now;
    device.status = data.status === 'maintenance' ? 'maintenance' : 'online';
    device.lastData = data;
    
    this.deviceDataCache.set(deviceId, data);
    
    this.devices.set(deviceId, device);
  }

  getLastDeviceData(deviceId: string): DeviceData | undefined {
    return this.deviceDataCache.get(deviceId);
  }

  getDevicesByStatus(status: 'online' | 'offline' | 'maintenance'): Device[] {
    return this.getAllDevices().filter(device => device.status === status);
  }

  markDeviceOffline(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device && device.status !== 'offline') {
      device.status = 'offline';
      device.lastSeen = new Date().toISOString();
      this.devices.set(deviceId, device);
      console.log(`📴 Device ${deviceId} marked as offline`);
    }
  }

  getDeviceStats(): { total: number; online: number; offline: number; maintenance: number } {
    const devices = this.getAllDevices();
    return {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      maintenance: devices.filter(d => d.status === 'maintenance').length
    };
  }
}
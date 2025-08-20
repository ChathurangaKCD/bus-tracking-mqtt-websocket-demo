export interface Device {
  id: string;
  name: string;
  lastSeen?: string;
  status: 'online' | 'offline' | 'maintenance';
  lastData?: DeviceData;
}

export interface DeviceData {
  deviceId: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  passengers: number;
  fuel: number;
  status: string;
  randomString: string;
}
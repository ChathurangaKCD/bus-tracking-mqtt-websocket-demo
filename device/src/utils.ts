import crypto from 'crypto';

export function validateDeviceId(deviceId: string): boolean {
  const match = deviceId.match(/^Bus-(\d+)$/);
  if (!match) return false;
  
  const busNumber = parseInt(match[1], 10);
  return busNumber >= 1 && busNumber <= 50;
}

export function generateRandomData(deviceId: string): DeviceData {
  const locations = [
    { lat: 6.9271, lng: 79.8612 }, // Colombo
    { lat: 7.2906, lng: 80.6337 }, // Kandy
    { lat: 6.0535, lng: 80.2210 }, // Galle
    { lat: 8.3114, lng: 80.4037 }, // Anuradhapura
    { lat: 9.6615, lng: 80.0255 }, // Jaffna
  ];
  
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  
  return {
    deviceId,
    timestamp: new Date().toISOString(),
    location: {
      lat: randomLocation.lat + latOffset,
      lng: randomLocation.lng + lngOffset
    },
    speed: Math.floor(Math.random() * 60) + 20,
    passengers: Math.floor(Math.random() * 40) + 10,
    fuel: Math.floor(Math.random() * 100),
    status: Math.random() > 0.9 ? 'maintenance' : 'active',
    randomString: generateRandomString(16)
  };
}

function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString('hex');
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
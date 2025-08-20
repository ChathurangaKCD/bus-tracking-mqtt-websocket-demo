import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'choreo-mqtt-demo-secret';

export function generatePassword(deviceId: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(`${deviceId}:${SECRET}`);
  return hash.digest('base64').substring(0, 16);
}

export function validateDevice(deviceId: string, password: string): boolean {
  if (!deviceId || !password) return false;
  
  const match = deviceId.match(/^Bus-(\d+)$/);
  if (!match) return false;
  
  const busNumber = parseInt(match[1], 10);
  if (busNumber < 1 || busNumber > 50) return false;
  
  const expectedPassword = generatePassword(deviceId);
  return password === expectedPassword;
}

export function parseAuthRequest(body: any): { username?: string; password?: string } {
  return {
    username: body.username || body.user,
    password: body.password || body.pass
  };
}
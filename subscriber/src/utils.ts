import chalk from 'chalk';
import Table from 'cli-table3';
import { DeviceData } from './types';

export function formatDeviceData(data: DeviceData): string {
  const lines = [
    `${chalk.bold('Device:')} ${chalk.blue(data.deviceId)}`,
    `${chalk.bold('Status:')} ${getStatusColor(data.status)}`,
    `${chalk.bold('Location:')} ${chalk.green(`${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`)}`,
    `${chalk.bold('Speed:')} ${chalk.cyan(`${data.speed} km/h`)}`,
    `${chalk.bold('Passengers:')} ${chalk.magenta(data.passengers)}`,
    `${chalk.bold('Fuel:')} ${getFuelColor(data.fuel)}`,
    `${chalk.bold('Random ID:')} ${chalk.gray(data.randomString)}`,
    `${chalk.bold('Timestamp:')} ${chalk.yellow(new Date(data.timestamp).toLocaleString())}`
  ];
  
  return lines.join('\n');
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return chalk.green(status);
    case 'maintenance':
      return chalk.yellow(status);
    case 'offline':
      return chalk.red(status);
    default:
      return chalk.gray(status);
  }
}

export function getFuelColor(fuel: number): string {
  const percentage = `${fuel}%`;
  if (fuel > 50) return chalk.green(percentage);
  if (fuel > 25) return chalk.yellow(percentage);
  return chalk.red(percentage);
}

export function clearScreen(): void {
  console.clear();
}

export function createDeviceTable(): any {
  return new Table({
    head: ['Device ID', 'Name', 'Status', 'Last Seen'],
    colWidths: [12, 15, 18, 25],
    style: {
      head: ['cyan'],
      border: ['gray']
    }
  });
}

export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
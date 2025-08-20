import { io, Socket } from 'socket.io-client';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import axios from 'axios';
import dotenv from 'dotenv';
import { Device, DeviceData } from './types';
import { formatDeviceData, clearScreen, createDeviceTable } from './utils';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://localhost:3000';

class SubscriberCLI {
  private socket: Socket | null = null;
  private selectedDevice: string | null = null;
  private isRunning = false;
  private updateCount = 0;

  async start(): Promise<void> {
    console.log(chalk.blue('🚌 Device Subscriber CLI'));
    console.log(chalk.gray(`🔗 Backend: ${BACKEND_URL}`));
    console.log(chalk.gray(`📡 WebSocket: ${WEBSOCKET_URL}`));
    console.log('');

    try {
      await this.connectToBackend();
      await this.showMainMenu();
    } catch (error) {
      console.error(chalk.red('❌ Failed to start:'), error);
      process.exit(1);
    }
  }

  private async connectToBackend(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(chalk.yellow('🔄 Connecting to backend...'));
      
      this.socket = io(WEBSOCKET_URL);

      this.socket.on('connect', () => {
        console.log(chalk.green('✅ Connected to backend'));
        this.setupSocketListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error(chalk.red('❌ Connection failed:'), error.message);
        reject(error);
      });
    });
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('device-update', (data: DeviceData) => {
      if (this.isRunning && data.deviceId === this.selectedDevice) {
        this.updateCount++;
        this.displayDeviceUpdate(data);
      }
    });

    this.socket.on('disconnect', () => {
      console.log(chalk.yellow('🔌 Disconnected from backend'));
    });

    this.socket.on('reconnect', () => {
      console.log(chalk.green('🔄 Reconnected to backend'));
      if (this.selectedDevice && this.isRunning) {
        this.socket?.emit('subscribe-device', this.selectedDevice);
      }
    });
  }

  private async showMainMenu(): Promise<void> {
    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '📋 List all devices', value: 'list' },
            { name: '🟢 Show online devices only', value: 'online' },
            { name: '📊 View device statistics', value: 'stats' },
            { name: '🔍 Monitor specific device', value: 'monitor' },
            { name: '❌ Exit', value: 'exit' }
          ]
        }
      ]);

      switch (action) {
        case 'list':
          await this.listAllDevices();
          break;
        case 'online':
          await this.listOnlineDevices();
          break;
        case 'stats':
          await this.showStats();
          break;
        case 'monitor':
          await this.selectDeviceToMonitor();
          break;
        case 'exit':
          this.cleanup();
          return;
      }
    }
  }

  private async listAllDevices(): Promise<void> {
    try {
      const response = await axios.get(`${BACKEND_URL}/devices`);
      const devices: Device[] = response.data.data;
      
      const table = createDeviceTable();
      devices.forEach(device => {
        table.push([
          device.id,
          device.name,
          this.getStatusIcon(device.status),
          device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'
        ]);
      });

      console.log('');
      console.log(chalk.blue('📋 All Devices'));
      console.log(table.toString());
      console.log('');
    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch devices:'), error);
    }
  }

  private async listOnlineDevices(): Promise<void> {
    try {
      const response = await axios.get(`${BACKEND_URL}/devices/online`);
      const devices: Device[] = response.data.data;
      
      if (devices.length === 0) {
        console.log(chalk.yellow('⚠️  No devices are currently online'));
        return;
      }

      const table = createDeviceTable();
      devices.forEach(device => {
        table.push([
          device.id,
          device.name,
          this.getStatusIcon(device.status),
          device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'
        ]);
      });

      console.log('');
      console.log(chalk.green(`🟢 Online Devices (${devices.length})`));
      console.log(table.toString());
      console.log('');
    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch online devices:'), error);
    }
  }

  private async showStats(): Promise<void> {
    try {
      const response = await axios.get(`${BACKEND_URL}/stats`);
      const stats = response.data.data;
      
      const table = new Table({
        head: ['Status', 'Count'],
        colWidths: [15, 10]
      });

      table.push(
        ['Total', stats.total],
        ['🟢 Online', chalk.green(stats.online)],
        ['🔴 Offline', chalk.red(stats.offline)],
        ['🔧 Maintenance', chalk.yellow(stats.maintenance)]
      );

      console.log('');
      console.log(chalk.blue('📊 Device Statistics'));
      console.log(table.toString());
      console.log('');
    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch statistics:'), error);
    }
  }

  private async selectDeviceToMonitor(): Promise<void> {
    try {
      const response = await axios.get(`${BACKEND_URL}/devices/online`);
      const devices: Device[] = response.data.data;
      
      if (devices.length === 0) {
        console.log(chalk.yellow('⚠️  No devices are currently online to monitor'));
        return;
      }

      const { deviceId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'deviceId',
          message: 'Select a device to monitor:',
          choices: devices.map(device => ({
            name: `${device.id} - ${device.name} (${device.status})`,
            value: device.id
          })).concat([
            { name: '← Back to main menu', value: 'back' }
          ])
        }
      ]);

      if (deviceId === 'back') return;

      await this.startMonitoring(deviceId);
    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch devices:'), error);
    }
  }

  private async startMonitoring(deviceId: string): Promise<void> {
    this.selectedDevice = deviceId;
    this.isRunning = true;
    this.updateCount = 0;

    console.log(chalk.blue(`\n🔍 Monitoring ${deviceId}...`));
    console.log(chalk.gray('Press Ctrl+C to stop monitoring\n'));

    if (this.socket) {
      this.socket.emit('subscribe-device', deviceId);
    }

    return new Promise((resolve) => {
      const stopMonitoring = () => {
        this.isRunning = false;
        if (this.socket && this.selectedDevice) {
          this.socket.emit('unsubscribe-device', this.selectedDevice);
        }
        this.selectedDevice = null;
        console.log(chalk.yellow('\n📴 Stopped monitoring device'));
        process.stdin.removeListener('keypress', keyHandler);
        resolve();
      };

      const keyHandler = (str: string, key: any) => {
        if (key.ctrl && key.name === 'c') {
          stopMonitoring();
        }
      };

      process.stdin.on('keypress', keyHandler);
      process.stdin.setRawMode(true);
      process.stdin.resume();
    });
  }

  private displayDeviceUpdate(data: DeviceData): void {
    const timestamp = new Date().toLocaleTimeString();
    const formattedData = formatDeviceData(data);
    
    console.log(chalk.cyan(`[${timestamp}] Update #${this.updateCount}:`));
    console.log(formattedData);
    console.log(chalk.gray('─'.repeat(50)));
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'online': return chalk.green('🟢 Online');
      case 'offline': return chalk.red('🔴 Offline');
      case 'maintenance': return chalk.yellow('🔧 Maintenance');
      default: return chalk.gray('❓ Unknown');
    }
  }

  private cleanup(): void {
    console.log(chalk.yellow('\n👋 Shutting down...'));
    if (this.socket) {
      this.socket.disconnect();
    }
    process.exit(0);
  }
}

const cli = new SubscriberCLI();

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 Received SIGINT, shutting down gracefully...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

cli.start().catch((error) => {
  console.error(chalk.red('❌ CLI Error:'), error);
  process.exit(1);
});
import * as mqtt from 'mqtt';
import { EventEmitter } from 'events';

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

export class MQTTService extends EventEmitter {
  private client: mqtt.MqttClient | null = null;
  private readonly brokerUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor(brokerUrl: string, username: string, password: string) {
    super();
    this.brokerUrl = brokerUrl;
    this.username = username;
    this.password = password;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`📡 Connecting to MQTT broker: ${this.brokerUrl}`);
      
      // Generate unique client ID for this replica to avoid conflicts
      const instanceId = process.env.INSTANCE_ID || Math.random().toString(36).substring(2, 15);
      const clientId = `backend-service-${instanceId}`;
      
      console.log(`🔗 Using MQTT client ID: ${clientId}`);
      
      this.client = mqtt.connect(this.brokerUrl, {
        clientId: clientId,
        username: this.username,
        password: this.password,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to MQTT broker');
        this.subscribeToAllDevices();
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
        reject(error);
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('reconnect', () => {
        console.log('🔄 Reconnecting to MQTT broker...');
      });

      this.client.on('close', () => {
        console.log('🔌 MQTT connection closed');
      });
    });
  }

  private subscribeToAllDevices(): void {
    if (!this.client) return;

    const topicPattern = '/some/path/+';
    this.client.subscribe(topicPattern, { qos: 1 }, (error) => {
      if (error) {
        console.error('❌ Failed to subscribe to topics:', error);
      } else {
        console.log(`📡 Subscribed to pattern: ${topicPattern}`);
      }
    });
  }

  private handleMessage(topic: string, message: Buffer): void {
    try {
      const deviceIdMatch = topic.match(/\/some\/path\/(.+)$/);
      if (!deviceIdMatch) {
        console.warn(`⚠️ Unknown topic format: ${topic}`);
        return;
      }

      const deviceId = deviceIdMatch[1];
      const data: DeviceData = JSON.parse(message.toString());
      
      console.log(`📥 Received data from ${deviceId}: ${data.status} at ${data.location.lat},${data.location.lng}`);
      
      this.emit('device-data', deviceId, data);
    } catch (error) {
      console.error('❌ Error processing MQTT message:', error);
    }
  }

  disconnect(): void {
    if (this.client) {
      console.log('🔌 Disconnecting from MQTT broker...');
      this.client.end(true);
      this.client = null;
    }
  }
}
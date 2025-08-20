import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { MQTTService } from './services/mqtt';
import { DeviceService } from './services/device';
import { setupRoutes } from './routes';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || 'admin';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'admin123';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const deviceService = new DeviceService();
const mqttService = new MQTTService(MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD);

setupRoutes(app, deviceService);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('subscribe-device', (deviceId: string) => {
    console.log(`📱 Client ${socket.id} subscribed to device: ${deviceId}`);
    socket.join(`device-${deviceId}`);
    
    const lastData = deviceService.getLastDeviceData(deviceId);
    if (lastData) {
      socket.emit('device-update', lastData);
    }
  });
  
  socket.on('unsubscribe-device', (deviceId: string) => {
    console.log(`📱 Client ${socket.id} unsubscribed from device: ${deviceId}`);
    socket.leave(`device-${deviceId}`);
  });
  
  socket.on('list-devices', () => {
    const devices = deviceService.getAllDevices();
    socket.emit('device-list', devices);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

mqttService.on('device-data', (deviceId, data) => {
  deviceService.updateDeviceData(deviceId, data);
  io.to(`device-${deviceId}`).emit('device-update', { deviceId, ...data });
});

mqttService.connect().then(() => {
  console.log('📡 MQTT service connected');
}).catch((error) => {
  console.error('❌ Failed to connect MQTT service:', error);
});

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`📡 Connected to MQTT broker: ${MQTT_BROKER_URL}`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  mqttService.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  mqttService.disconnect();
  server.close();
  process.exit(0);
});
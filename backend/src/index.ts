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

// Create separate servers for HTTP and WebSocket
const app = express();
const httpServer = createServer(app);
const wsApp = express();
const wsServer = createServer(wsApp);

const io = new SocketIOServer(wsServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Port configuration - support legacy PORT env var for backward compatibility
const HTTP_PORT = process.env.HTTP_PORT || process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;
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

// Add a health check endpoint to the WebSocket server
wsApp.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'websocket-server' });
});

// Start both servers
httpServer.listen(HTTP_PORT, () => {
  console.log(`🚀 HTTP API server running on http://localhost:${HTTP_PORT}`);
  console.log(`📡 Connected to MQTT broker: ${MQTT_BROKER_URL}`);
});

wsServer.listen(WS_PORT, () => {
  console.log(`🔗 WebSocket server running on ws://localhost:${WS_PORT}`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  mqttService.disconnect();
  
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  wsServer.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  mqttService.disconnect();
  httpServer.close();
  wsServer.close();
  process.exit(0);
});
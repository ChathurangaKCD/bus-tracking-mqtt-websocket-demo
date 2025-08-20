# Choreo MQTT Demo

A comprehensive demonstration of MQTT messaging integration with web services, featuring real-time device tracking through WebSocket connections.

## System Overview

This project demonstrates the integration between the following components:

- **MQTT Broker (RabbitMQ)**: Message broker with HTTP authentication
- **Device CLI**: Node.js/TypeScript script simulating IoT devices (buses) 
- **Auth Server**: HTTP authentication backend for RabbitMQ
- **Backend Service**: Bridge between MQTT and WebSocket connections
- **Subscriber CLI**: Interactive client for real-time device monitoring

## Architecture

```
┌─────────────┐    MQTT     ┌─────────────────┐         ┌────────────────┐
│   Device    ├────────────►│   MQTT Broker   │◄────────┤ Auth Server    │
│   (CLI)     │             │   (RabbitMQ)    │         │                │
└─────────────┘             └────────┬────────┘         └────────────────┘
                                     │                           │
                                     │ MQTT Sub                  │ HTTP Auth
                                     │                           │
┌─────────────┐    WebSocket ┌──────▼────────┐                 │
│ Subscriber  ├─────────────►│    Backend    │◄────────────────┘
│   (CLI)     │              │   Service     │
└─────────────┘              └───────────────┘
```

## Quick Start

### 1. Start RabbitMQ
```bash
cd rabbitmq
./start.sh
```

### 2. Start Auth Server
```bash
cd auth-server
npm install
npm run dev
```

### 3. Start Backend Service
```bash
cd backend
npm install
npm run dev
```

### 4. Run Device Simulator
```bash
cd device
npm install
# Get password from auth server output
npm run dev -- --device-id Bus-1 --password <password>
```

### 5. Start Subscriber
```bash
cd subscriber
npm install
npm run dev
```

## Component Details

### MQTT Broker (RabbitMQ)
- Port 1883 (MQTT)
- Port 15672 (Management UI)
- HTTP authentication via auth-server
- Credentials: admin/admin123

### Auth Server (Port 3001)
- Generates deterministic passwords for 50 bus devices
- Provides HTTP endpoints for RabbitMQ authentication
- Enforces topic-based access control

### Backend Service (Port 3000)
- REST API for device management
- WebSocket server for real-time updates
- MQTT subscriber for all device topics

### Device CLI
- Simulates bus devices publishing location data
- Command line arguments for device ID and password
- Publishes to `/some/path/{deviceId}` every 5 seconds

### Subscriber CLI
- Interactive menu for device monitoring
- Real-time WebSocket updates
- Device listing and statistics

## API Endpoints

### Backend Service
- `GET /devices` - List all devices
- `GET /devices/online` - List online devices only
- `GET /devices/:id` - Get specific device
- `GET /stats` - Device statistics
- `WebSocket /` - Real-time updates

### Auth Server
- `POST /user` - User authentication
- `POST /vhost` - Virtual host authorization
- `POST /resource` - Resource authorization  
- `POST /topic` - Topic authorization

## Environment Configuration

Each component has its own `.env.example` file with required configuration:

- **auth-server**: Port and secret key
- **backend**: Port and MQTT connection details
- **device**: MQTT broker URL and publish interval
- **subscriber**: Backend and WebSocket URLs

## Device Credentials

The auth server generates passwords for buses 1-50:
- Device IDs: `Bus-1`, `Bus-2`, ..., `Bus-50`
- Passwords: Generated using SHA256 hash of deviceId + secret

## Features

- ✅ HTTP authentication for MQTT connections
- ✅ Real-time device tracking via WebSocket
- ✅ Interactive CLI interfaces
- ✅ Device status monitoring
- ✅ Topic-based access control
- ✅ Automatic reconnection handling
- ✅ Comprehensive error handling

## Development

Each component supports:
- `npm run dev` - Development mode with auto-reload
- `npm run build` - TypeScript compilation
- `npm run lint` - Code linting

## Monitoring

- RabbitMQ Management: http://localhost:15672
- Device count: 50 buses (Bus-1 to Bus-50)
- Real-time updates via WebSocket
- REST API for device status

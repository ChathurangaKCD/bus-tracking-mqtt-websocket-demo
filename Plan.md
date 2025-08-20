# Choreo MQTT Demo - Design Plan

## System Architecture Overview

The system demonstrates integration between MQTT messaging and web services, consisting of five main components:

```
┌─────────────┐         ┌─────────────────┐         ┌────────────────┐
│   Device    │ MQTT    │   MQTT Broker   │         │ DeviceAuthServer│
│   (CLI)     ├────────►│   (RabbitMQ)    │◄────────┤                │
└─────────────┘         └────────┬────────┘         └────────────────┘
                                 │                           │
                                 │                           │ HTTP Auth
                                 │                           │
┌─────────────┐         ┌────────▼────────┐                 │
│ Subscriber  │ WS      │     Backend     │◄────────────────┘
│   (CLI)     ├────────►│   (Node.js)     │
└─────────────┘         └─────────────────┘
```

## Component Details

### 1. MQTT Broker (RabbitMQ)
- **Technology**: RabbitMQ with MQTT plugin
- **Authentication**: rabbitmq_auth_backend_http
- **Deployment**: Docker Compose
- **Configuration**:
  - Enable MQTT plugin
  - Configure HTTP authentication backend
  - Set up topic permissions structure

### 2. Device (CLI Application)
- **Language**: TypeScript/Node.js
- **Purpose**: Simulate IoT devices (buses) publishing location data
- **Key Features**:
  - Command-line arguments: deviceId, password
  - MQTT client connection using provided credentials
  - Periodic publishing to topic: `/some/path/<deviceId>`
  - Random string generation for demo data
- **Libraries**:
  - `mqtt` - MQTT client library
  - `commander` - CLI argument parsing
  - `dotenv` - Environment configuration

### 3. DeviceAuthServer
- **Language**: TypeScript/Node.js
- **Purpose**: Provide HTTP authentication for RabbitMQ
- **Endpoints**:
  - `/user` - Authenticate device credentials
  - `/vhost` - Authorize virtual host access
  - `/resource` - Authorize resource permissions
  - `/topic` - Authorize topic access
- **Features**:
  - Generate and display passwords for Bus-1 through Bus-50 on startup
  - Deterministic password generation (Base64 encoding of device ID + secret)
  - Return appropriate HTTP responses for RabbitMQ auth backend
- **Libraries**:
  - `express` - HTTP server
  - `body-parser` - Request parsing

### 4. Backend Service
- **Language**: TypeScript/Node.js
- **Purpose**: Bridge between MQTT and web clients
- **Features**:
  - WebSocket server for real-time updates
  - REST API for device listing
  - MQTT subscription management
  - Device registry (Bus-1 to Bus-50)
- **Endpoints**:
  - `GET /devices` - List available devices
  - WebSocket `/` - Real-time device updates
- **Libraries**:
  - `socket.io` - WebSocket implementation
  - `express` - HTTP server
  - `mqtt` - MQTT client for subscribing

### 5. Subscriber (CLI Application)
- **Language**: TypeScript/Node.js
- **Purpose**: Demonstrate client consumption of device data
- **Features**:
  - Connect to backend via WebSocket
  - List available devices
  - Select device to monitor
  - Display real-time updates
- **Libraries**:
  - `socket.io-client` - WebSocket client
  - `inquirer` - Interactive CLI prompts
  - `axios` - HTTP requests

## Implementation Plan

### Phase 1: Infrastructure Setup
1. Create Docker Compose configuration for RabbitMQ
2. Configure RabbitMQ with MQTT plugin and HTTP auth backend
3. Create project structure and TypeScript configuration

### Phase 2: Authentication Server
1. Implement DeviceAuthServer with required endpoints
2. Create password generation logic
3. Test with RabbitMQ integration

### Phase 3: Device Implementation
1. Create Device CLI application
2. Implement MQTT connection and publishing logic
3. Add error handling and reconnection logic

### Phase 4: Backend Service
1. Set up Express server with Socket.io
2. Implement device listing endpoint
3. Create MQTT subscriber for all device topics
4. Implement WebSocket event broadcasting

### Phase 5: Subscriber Client
1. Create Subscriber CLI application
2. Implement device selection interface
3. Add WebSocket connection and event handling
4. Display real-time updates

### Phase 6: Testing & Documentation
1. Create integration tests
2. Add README with setup instructions
3. Create demo scripts

## Directory Structure

```
choreo-mqtt-demo/
├── docker-compose.yml
├── rabbitmq/
│   └── rabbitmq.conf
├── device/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
├── auth-server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
├── subscriber/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
└── shared/
    └── types.ts

```

## Security Considerations

- Use environment variables for sensitive configuration
- Implement proper MQTT topic ACLs
- Add rate limiting to prevent abuse
- Use HTTPS/WSS in production
- Validate all input data

## Deployment Considerations

- All services should be containerizable
- Support for environment-based configuration
- Health check endpoints
- Logging and monitoring integration
- Graceful shutdown handling
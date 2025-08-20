import { Express, Request, Response } from 'express';
import { DeviceService } from '../services/device';

export function setupRoutes(app: Express, deviceService: DeviceService): void {
  
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'mqtt-backend'
    });
  });

  app.get('/devices', (_req: Request, res: Response) => {
    const devices = deviceService.getAllDevices();
    res.json({
      success: true,
      data: devices,
      count: devices.length
    });
  });

  app.get('/devices/online', (_req: Request, res: Response) => {
    const devices = deviceService.getOnlineDevices();
    res.json({
      success: true,
      data: devices,
      count: devices.length
    });
  });

  app.get('/devices/:deviceId', (req: Request, res: Response): void => {
    const { deviceId } = req.params;
    const device = deviceService.getDevice(deviceId);
    
    if (!device) {
      res.status(404).json({
        success: false,
        error: 'Device not found'
      });
      return;
    }

    res.json({
      success: true,
      data: device
    });
  });

  app.get('/devices/:deviceId/data', (req: Request, res: Response): void => {
    const { deviceId } = req.params;
    const device = deviceService.getDevice(deviceId);
    
    if (!device) {
      res.status(404).json({
        success: false,
        error: 'Device not found'
      });
      return;
    }

    const lastData = deviceService.getLastDeviceData(deviceId);
    
    res.json({
      success: true,
      data: lastData || null
    });
  });

  app.get('/stats', (_req: Request, res: Response) => {
    const stats = deviceService.getDeviceStats();
    res.json({
      success: true,
      data: stats
    });
  });

  app.get('/devices/status/:status', (req: Request, res: Response): void => {
    const { status } = req.params;
    
    if (!['online', 'offline', 'maintenance'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: online, offline, or maintenance'
      });
      return;
    }

    const devices = deviceService.getDevicesByStatus(status as any);
    
    res.json({
      success: true,
      data: devices,
      count: devices.length
    });
  });
}
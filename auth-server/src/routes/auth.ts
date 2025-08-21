import { Router, Request, Response } from 'express';
import { validateDevice, parseAuthRequest } from '../utils';

export const authRoutes = Router();

authRoutes.post('/user', (req: Request, res: Response): void => {
  console.log('AUTH /user request:', req.body);
  
  const { username, password } = parseAuthRequest(req.body);
  
  if (!username || !password) {
    console.log('[AUTH] Missing credentials');
    res.status(200).send('deny');
    return;
  }
  
  if (username === 'admin' && password === 'admin123') {
    console.log('[AUTH] Admin authenticated');
    res.status(200).send('allow administrator management');
    return;
  }
  
  if (validateDevice(username, password)) {
    console.log(`[AUTH] Device ${username} authenticated`);
    res.status(200).send('allow');
    return;
  }
  
  console.log(`[AUTH] Authentication failed for ${username}`);
  res.status(200).send('deny');
});

authRoutes.post('/vhost', (req: Request, res: Response): void => {
  console.log('AUTH /vhost request:', req.body);
  
  const { username, vhost } = req.body;
  const allowedVhost = process.env.ALLOWED_VHOST || '/';
  
  if (!username || !vhost) {
    res.status(200).send('deny');
    return;
  }
  
  // Check if vhost matches the allowed vhost (handle URL encoding)
  if (vhost === allowedVhost || 
      vhost === encodeURIComponent(allowedVhost) ||
      (allowedVhost === '/' && vhost === '%2F')) {
    console.log(`[AUTH] Vhost access granted for ${username} to ${vhost}`);
    res.status(200).send('allow');
    return;
  }
  
  console.log(`[AUTH] Vhost access denied for ${username} to ${vhost} (allowed: ${allowedVhost})`);
  res.status(200).send('deny');
});

authRoutes.post('/resource', (req: Request, res: Response): void => {
  console.log('AUTH /resource request:', req.body);
  
  const { username, vhost, resource, permission } = req.body;
  
  if (!username || !vhost || !resource || !permission) {
    res.status(200).send('deny');
    return;
  }
  
  if (username === 'admin') {
    console.log(`[AUTH] Resource access granted for admin`);
    res.status(200).send('allow');
    return;
  }
  
  const deviceMatch = username.match(/^Bus-(\d+)$/);
  if (deviceMatch) {
    // Allow devices to write to exchanges (needed for MQTT publishing)
    if ((resource === 'exchange' || resource === 'topic') && permission === 'write') {
      console.log(`[AUTH] Resource access granted for ${username} - ${permission} to ${resource}`);
      res.status(200).send('allow');
      return;
    }
    
    // Allow devices to read from topics/exchanges
    if ((resource === 'exchange' || resource === 'topic') && permission === 'read') {
      console.log(`[AUTH] Resource access granted for ${username} - ${permission} to ${resource}`);
      res.status(200).send('allow');
      return;
    }
  }
  
  console.log(`[AUTH] Resource access denied for ${username}`);
  res.status(200).send('deny');
});

authRoutes.post('/topic', (req: Request, res: Response): void => {
  console.log('AUTH /topic request:', req.body);
  
  const { username, vhost, resource, permission, routing_key } = req.body;
  
  if (!username || !vhost || !resource || !permission || !routing_key) {
    res.status(200).send('deny');
    return;
  }
  
  if (username === 'admin') {
    console.log(`[AUTH] Topic access granted for admin to ${routing_key}`);
    res.status(200).send('allow');
    return;
  }
  
  const deviceMatch = username.match(/^Bus-(\d+)$/);
  if (deviceMatch) {
    // MQTT topics are converted to AMQP routing keys with dots instead of slashes
    const allowedPath = `.some.path.${username}`;
    
    if (permission === 'write' && 
        (routing_key === allowedPath || routing_key.startsWith(`${allowedPath}.`))) {
      console.log(`[AUTH] Topic write access granted for ${username} to ${routing_key}`);
      res.status(200).send('allow');
      return;
    }
    
    if (permission === 'read') {
      console.log(`[AUTH] Topic read access granted for ${username} to ${routing_key}`);
      res.status(200).send('allow');
      return;
    }
  }
  
  console.log(`[AUTH] Topic access denied for ${username} to ${routing_key}`);
  res.status(200).send('deny');
});
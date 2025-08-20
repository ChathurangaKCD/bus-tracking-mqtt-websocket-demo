import { Router, Request, Response } from 'express';
import { validateDevice, parseAuthRequest } from '../utils';

export const authRoutes = Router();

authRoutes.post('/user', (req: Request, res: Response): void => {
  console.log('AUTH /user request:', req.body);
  
  const { username, password } = parseAuthRequest(req.body);
  
  if (!username || !password) {
    console.log('❌ Missing credentials');
    res.status(200).send('deny');
    return;
  }
  
  if (username === 'admin' && password === 'admin123') {
    console.log('✅ Admin authenticated');
    res.status(200).send('allow administrator management');
    return;
  }
  
  if (validateDevice(username, password)) {
    console.log(`✅ Device ${username} authenticated`);
    res.status(200).send('allow');
    return;
  }
  
  console.log(`❌ Authentication failed for ${username}`);
  res.status(200).send('deny');
});

authRoutes.post('/vhost', (req: Request, res: Response): void => {
  console.log('AUTH /vhost request:', req.body);
  
  const { username, vhost } = req.body;
  
  if (!username || !vhost) {
    res.status(200).send('deny');
    return;
  }
  
  if (vhost === '/' || vhost === '%2F') {
    console.log(`✅ Vhost access granted for ${username}`);
    res.status(200).send('allow');
    return;
  }
  
  console.log(`❌ Vhost access denied for ${username} to ${vhost}`);
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
    console.log(`✅ Resource access granted for admin`);
    res.status(200).send('allow');
    return;
  }
  
  const deviceMatch = username.match(/^Bus-(\d+)$/);
  if (deviceMatch) {
    // Allow devices to write to exchanges (needed for MQTT publishing)
    if ((resource === 'exchange' || resource === 'topic') && permission === 'write') {
      console.log(`✅ Resource access granted for ${username} - ${permission} to ${resource}`);
      res.status(200).send('allow');
      return;
    }
    
    // Allow devices to read from topics/exchanges
    if ((resource === 'exchange' || resource === 'topic') && permission === 'read') {
      console.log(`✅ Resource access granted for ${username} - ${permission} to ${resource}`);
      res.status(200).send('allow');
      return;
    }
  }
  
  console.log(`❌ Resource access denied for ${username}`);
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
    console.log(`✅ Topic access granted for admin to ${routing_key}`);
    res.status(200).send('allow');
    return;
  }
  
  const deviceMatch = username.match(/^Bus-(\d+)$/);
  if (deviceMatch) {
    // MQTT topics are converted to AMQP routing keys with dots instead of slashes
    const allowedPath = `.some.path.${username}`;
    
    if (permission === 'write' && 
        (routing_key === allowedPath || routing_key.startsWith(`${allowedPath}.`))) {
      console.log(`✅ Topic write access granted for ${username} to ${routing_key}`);
      res.status(200).send('allow');
      return;
    }
    
    if (permission === 'read') {
      console.log(`✅ Topic read access granted for ${username} to ${routing_key}`);
      res.status(200).send('allow');
      return;
    }
  }
  
  console.log(`❌ Topic access denied for ${username} to ${routing_key}`);
  res.status(200).send('deny');
});
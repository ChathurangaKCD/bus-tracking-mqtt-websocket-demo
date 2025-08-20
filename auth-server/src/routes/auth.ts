import { Router, Request, Response } from 'express';
import { validateDevice, parseAuthRequest } from '../utils';

export const authRoutes = Router();

authRoutes.post('/user', (req: Request, res: Response) => {
  console.log('AUTH /user request:', req.body);
  
  const { username, password } = parseAuthRequest(req.body);
  
  if (!username || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).send('deny');
  }
  
  if (username === 'admin' && password === 'admin123') {
    console.log('✅ Admin authenticated');
    return res.send('allow administrator management');
  }
  
  if (validateDevice(username, password)) {
    console.log(`✅ Device ${username} authenticated`);
    return res.send('allow');
  }
  
  console.log(`❌ Authentication failed for ${username}`);
  res.status(401).send('deny');
});

authRoutes.post('/vhost', (req: Request, res: Response) => {
  console.log('AUTH /vhost request:', req.body);
  
  const { username, vhost } = req.body;
  
  if (!username || !vhost) {
    return res.status(400).send('deny');
  }
  
  if (vhost === '/' || vhost === '%2F') {
    console.log(`✅ Vhost access granted for ${username}`);
    return res.send('allow');
  }
  
  console.log(`❌ Vhost access denied for ${username} to ${vhost}`);
  res.status(401).send('deny');
});

authRoutes.post('/resource', (req: Request, res: Response) => {
  console.log('AUTH /resource request:', req.body);
  
  const { username, vhost, resource, permission } = req.body;
  
  if (!username || !vhost || !resource || !permission) {
    return res.status(400).send('deny');
  }
  
  if (username === 'admin') {
    console.log(`✅ Resource access granted for admin`);
    return res.send('allow');
  }
  
  const deviceMatch = username.match(/^Bus-(\d+)$/);
  if (deviceMatch && resource === 'topic' && permission === 'write') {
    console.log(`✅ Resource access granted for ${username}`);
    return res.send('allow');
  }
  
  if (resource === 'topic' && permission === 'read') {
    console.log(`✅ Read access granted for ${username}`);
    return res.send('allow');
  }
  
  console.log(`❌ Resource access denied for ${username}`);
  res.status(401).send('deny');
});

authRoutes.post('/topic', (req: Request, res: Response) => {
  console.log('AUTH /topic request:', req.body);
  
  const { username, vhost, resource, permission, routing_key } = req.body;
  
  if (!username || !vhost || !resource || !permission || !routing_key) {
    return res.status(400).send('deny');
  }
  
  if (username === 'admin') {
    console.log(`✅ Topic access granted for admin to ${routing_key}`);
    return res.send('allow');
  }
  
  const deviceMatch = username.match(/^Bus-(\d+)$/);
  if (deviceMatch) {
    const allowedPath = `/some/path/${username}`;
    const allowedPathWithWildcard = `${allowedPath}/#`;
    
    if (permission === 'write' && 
        (routing_key === allowedPath || routing_key.startsWith(`${allowedPath}/`))) {
      console.log(`✅ Topic write access granted for ${username} to ${routing_key}`);
      return res.send('allow');
    }
    
    if (permission === 'read') {
      console.log(`✅ Topic read access granted for ${username} to ${routing_key}`);
      return res.send('allow');
    }
  }
  
  console.log(`❌ Topic access denied for ${username} to ${routing_key}`);
  res.status(401).send('deny');
});
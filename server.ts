import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const dataFilePath = path.join(process.cwd(), 'bank_state.json');

  // Load state helper
  const getBankState = () => {
    const defaultState = {
      balances: {
        erik: 50000,
        nera: 50000,
        vito: 50000
      },
      history: [],
      listings: [],
      reservations: [],
      vehicleOrders: [],
      inquiries: []
    };
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify(defaultState, null, 2));
      return defaultState;
    }
    try {
      const content = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        balances: parsed.balances || defaultState.balances,
        history: Array.isArray(parsed.history) ? parsed.history : defaultState.history,
        listings: Array.isArray(parsed.listings) ? parsed.listings : [],
        reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
        vehicleOrders: Array.isArray(parsed.vehicleOrders) ? parsed.vehicleOrders : [],
        inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : []
      };
    } catch (e) {
      console.error('Error reading bank state, resetting:', e);
      return defaultState;
    }
  };

  // Save state helper
  const saveBankState = (state: any) => {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(state, null, 2));
    } catch (e) {
      console.error('Error saving bank state:', e);
    }
  };

  // API routes FIRST
  app.get('/api/bank-state', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(getBankState());
  });

  app.post('/api/bank-state', (req, res) => {
    const { balances, history, listings, reservations, vehicleOrders, inquiries } = req.body;
    const currentState = getBankState();
    
    if (balances && history) {
      const newState = {
        balances,
        history,
        listings: Array.isArray(listings) ? listings : currentState.listings,
        reservations: Array.isArray(reservations) ? reservations : currentState.reservations,
        vehicleOrders: Array.isArray(vehicleOrders) ? vehicleOrders : currentState.vehicleOrders,
        inquiries: Array.isArray(inquiries) ? inquiries : currentState.inquiries
      };
      saveBankState(newState);
      res.json({ status: 'success', state: newState });
    } else {
      res.status(400).json({ error: 'Invalid balances or history payload' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

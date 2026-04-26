import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`BoostFlow API Server running on http://localhost:${PORT}`);
  console.log(`SMM Panel Mode: INTERNAL (built-in)`);
  console.log(`External Provider: ${process.env.SMM_API_KEY ? 'Configured (will be preferred)' : 'Not configured'}`);
  console.log(`Raw SMM API: POST http://localhost:${PORT}/api/v2`);
  console.log(`Admin Orders: GET http://localhost:${PORT}/api/admin/orders`);
});

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  res.json({
    status: 'ok',
    mode: 'internal-smm-panel',
    timestamp: new Date().toISOString(),
  });
}

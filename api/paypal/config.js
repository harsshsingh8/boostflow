export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientId = process.env.PAYPAL_CLIENT_ID || 'AaCi1aE_vOFlp3hyWA4CSiebcp37z5YaFDIEctTELT43J5OrdQxZUDLAvzW4fl0TKR_AYeRyBmTovSfE';
  const env = process.env.PAYPAL_ENV || 'live';
  res.json({ clientId, env });
}

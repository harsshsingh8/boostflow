export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientId = process.env.PAYPAL_CLIENT_ID || 'Ac7tBj5EoEgz82HNT6_99dtI-T3fbkwDaJGHhTQWabuPKkSC_HN3-fxo23otojXp8uHwoJf1X7y5sQ7s';
  const env = process.env.PAYPAL_ENV || 'sandbox';
  res.json({ clientId, env });
}

const EDGE_URL = 'https://zdwlllkpnkzhmpitanwz.supabase.co/functions/v1/template-api';

export default async function handler(req, res) {
  try {
    const secret = String(process.env.TEMPLATE_API_KEY || '').trim();
    if (!secret) {
      return res.status(500).json({ error: 'TEMPLATE_API_KEY is not configured in Vercel' });
    }

    if (!['GET', 'POST'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const upstream = await fetch(EDGE_URL, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-rastamozh-key': secret
      },
      body: req.method === 'POST' ? JSON.stringify(req.body || {}) : undefined
    });

    const raw = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    return res.send(raw);
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

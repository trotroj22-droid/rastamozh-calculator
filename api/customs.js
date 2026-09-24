export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = process.env.CALCUS_CLIENT;
  const key = process.env.CALCUS_KEY;

  if (!client || !key) {
    return res.status(500).json({ error: 'Calcus API credentials are not configured' });
  }

  const b = req.body || {};
  const payload = {
    owner: Number(b.owner),
    age: String(b.age),
    engine: Number(b.engine),
    power: Number(b.power),
    power_unit: Number(b.power_unit || 1),
    value: Number(b.value || 0),
    price: Number(b.price),
    curr: String(b.curr || 'RUB'),
    year: Number(b.year || 2026)
  };

  if (!payload.owner || !payload.age || !payload.engine || !payload.price) {
    return res.status(400).json({ error: 'Не заполнены обязательные параметры' });
  }

  try {
    const upstream = await fetch('https://calcus.ru/api/v1/Customs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'client': client,
        'key': key
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = { error: text || 'Calcus returned a non-JSON response' }; }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.message || data?.error || `Calcus HTTP ${upstream.status}`,
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: e?.message || 'Ошибка соединения с Calcus' });
  }
}
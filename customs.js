export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = String(process.env.CALCUS_CLIENT || '').trim();
  const key = String(process.env.CALCUS_KEY || '').trim();

  if (!client || !key) {
    return res.status(500).json({
      error: 'Не заданы CALCUS_CLIENT / CALCUS_KEY в Vercel Environment Variables'
    });
  }

  const b = req.body || {};
  const payload = {
    owner: Number(b.owner),
    age: String(b.age || ''),
    engine: Number(b.engine),
    power: Number(b.power),
    power_unit: Number(b.power_unit || 1),
    value: Number(b.value || 0),
    price: Number(b.price),
    curr: String(b.curr || 'RUB'),
    year: Number(b.year || 2026)
  };

  if (!payload.owner || !payload.age || !payload.engine || !payload.price) {
    return res.status(400).json({ error: 'Не заполнены обязательные параметры расчёта' });
  }

  try {
    const upstream = await fetch('https://calcus.ru/api/v1/Customs', {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain;q=0.9, */*;q=0.8',
        'Client': client,
        'Key': key,
        'User-Agent': 'Mozilla/5.0 (compatible; RastamozhCalculator/1.0)'
      },
      body: JSON.stringify(payload)
    });

    const contentType = upstream.headers.get('content-type') || '';
    const location = upstream.headers.get('location') || '';
    const raw = await upstream.text();

    if (upstream.status >= 300 && upstream.status < 400) {
      return res.status(502).json({
        error:
          `Calcus вернул редирект HTTP ${upstream.status}` +
          (location ? ` → ${location}` : '')
      });
    }

    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {}

    if (!data) {
      const preview = raw
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 350);

      return res.status(502).json({
        error:
          `Calcus вернул не JSON. HTTP ${upstream.status}; ` +
          `Content-Type: ${contentType || 'не указан'}; ` +
          `Ответ: ${preview || '[пустой ответ]'}`
      });
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error:
          data?.message ||
          data?.error ||
          `Calcus HTTP ${upstream.status}`,
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({
      error: `Ошибка соединения с Calcus: ${e?.message || String(e)}`
    });
  }
}
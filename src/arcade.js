'use strict';

// Real Arcade provider — implements the documented pipeline:
//   patterns/create → jobs/get → categories/list → categories/get
//   → products/create → jobs/get → products/get
//
// The API key only ever lives in the server environment — never in client
// code, bundles, or logs. Results are persisted as recorded bundles with
// provenance kind 'arcade-api' so the demo can replay them offline honestly.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BASE = 'https://platform.arcade.ai/v1';
const UA = 'one-gift-many-people/0.1';

async function call(apiKey, endpoint, body) {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': UA,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`arcade ${endpoint} HTTP ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function waitJob(apiKey, jobId, timeoutMs) {
  const deadline = Date.now() + (timeoutMs || 240000);
  for (;;) {
    const job = await call(apiKey, 'jobs/get', { jobId });
    if (job.status === 'succeeded') return job.result || {};
    if (job.status === 'failed') {
      throw new Error(`arcade job failed: ${(job.error && job.error.message) || 'unknown'}`);
    }
    if (Date.now() > deadline) throw new Error('arcade job timed out');
    await new Promise((r) => setTimeout(r, 5000));
  }
}

function pickCategory(items, categoryName) {
  const wanted = String(categoryName || 'Decorative Pillows').toLowerCase();
  const exact = items.find((c) => c.name.toLowerCase() === wanted);
  if (exact) return exact;
  const partial = items.find((c) => c.name.toLowerCase().includes(wanted) || wanted.includes(c.name.toLowerCase()));
  if (partial) return partial;
  // "pillow cover" → Decorative Pillows
  if (/pillow|cushion/.test(wanted)) {
    return items.find((c) => /pillow/i.test(c.name));
  }
  return null;
}

function extFrom(url, contentType) {
  if (/webp/.test(contentType || url)) return 'webp';
  if (/png/.test(contentType || url)) return 'png';
  return 'jpg';
}

function createArcadeProvider(apiKey, bundlesDir, options) {
  const categoryName = (options && options.categoryName) || 'Decorative Pillows';

  async function generate(fingerprint, briefText) {
    // 1. pattern
    const patternJob = await call(apiKey, 'patterns/create', {
      requestId: `ogmp-${fingerprint}-${crypto.randomBytes(4).toString('hex')}`,
      prompt: briefText,
    });
    const patternResult = await waitJob(apiKey, patternJob.jobId);
    const patternId = patternResult.patternId;
    if (!patternId) throw new Error('pattern job returned no patternId');

    // 2. category + default-complete selections
    const cats = await call(apiKey, 'categories/list', {});
    const cat = pickCategory(cats.items || [], categoryName);
    if (!cat) throw new Error(`no arcade category matching "${categoryName}"`);
    const opts = await call(apiKey, 'categories/get', { categoryId: cat.categoryId, selections: {} });
    if (!opts.canManufacture) throw new Error(`category "${cat.name}" cannot manufacture with default selections`);
    const selections = opts.selections;

    // 3. product
    const productJob = await call(apiKey, 'products/create', {
      requestId: `ogmp-${fingerprint}-p-${crypto.randomBytes(4).toString('hex')}`,
      patternId,
      categoryId: cat.categoryId,
      selections,
    });
    const productResult = await waitJob(apiKey, productJob.jobId);
    const productId = productResult.productId;
    if (!productId) throw new Error('product job returned no productId');

    // 4. retrieve product + price
    const product = await call(apiKey, 'products/get', { productId, quantity: 1 });

    // 5. download the primary image locally — remote URLs are short-lived.
    const images = product.images || [];
    const primary = product.imageUrl || images[0];
    if (!primary) throw new Error('product returned no images');
    const imgUrl = typeof primary === 'string' ? primary : primary.url || primary.imageUrl;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) throw new Error(`image download HTTP ${imgRes.status}`);
    const imgPath = `bundles/assets/arcade-${fingerprint}.${extFrom(imgUrl, imgRes.headers.get('content-type'))}`;
    fs.mkdirSync(path.join(bundlesDir, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(bundlesDir, '..', imgPath), Buffer.from(await imgRes.arrayBuffer()));

    const unit = product.unitPrice;
    const quote = unit == null
      ? null
      : {
          unitPrice: typeof unit === 'object' ? String(unit.amount ?? unit.value ?? unit.price) : String(unit),
          currency: (typeof unit === 'object' && unit.currency) || 'USD',
          quantity: 1,
          shipping: 'not provided',
          tax: 'not provided',
          duties: 'not provided',
          expiresAt: null,
          configuration: selections,
        };

    return {
      kind: 'recorded-result',
      briefFingerprint: fingerprint,
      provenance: {
        kind: 'arcade-api',
        label: 'Recorded via Arcade API',
        method: `patterns/create → products/create (category "${cat.name}")`,
        recordedAt: new Date().toISOString(),
      },
      product: {
        name: product.name || `${cat.name} — generated pattern`,
        category: cat.name,
        configuration: selections,
      },
      image: imgPath,
      callouts: [],
      quote,
      arcade: { patternId, productId, categoryId: cat.categoryId },
    };
  }

  return {
    kind: 'arcade',
    request(fingerprint, briefText) {
      const jobId = `arcade_${crypto.randomBytes(6).toString('hex')}`;
      const done = generate(fingerprint, briefText)
        .then((bundle) => {
          fs.writeFileSync(path.join(bundlesDir, `${fingerprint}.json`), JSON.stringify(bundle, null, 2));
          return { bundle };
        })
        .catch((e) => ({ bundle: null, error: `arcade: ${e.message}` }));
      return { jobId, done };
    },
  };
}

module.exports = { createArcadeProvider };

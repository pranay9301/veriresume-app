export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const fs = require('fs');
  const path = require('path');
  const pkg = require(path.join(process.cwd(), '..', 'package.json'));

  const root = path.join(process.cwd(), '..');
  const buildDir = path.join(root, 'build');
  const srcDir = path.join(root, 'src');
  const apiDir = path.join(root, 'api');

  const data = {
    env: {
      node: process.version || null,
      vercel: process.env.VERCEL === '1',
      region: process.env.VERCEL_REGION || null,
      geminiKeyPresent: Boolean(process.env.GEMINI_API_KEY),
    },
    package: {
      name: pkg.name,
      version: pkg.version,
      dependencies: Object.keys(pkg.dependencies || {}),
      devDependencies: Object.keys(pkg.devDependencies || {}),
    },
    filesystem: {
      rootExists: fs.existsSync(root),
      buildExists: fs.existsSync(buildDir),
      srcExists: fs.existsSync(srcDir),
      apiExists: fs.existsSync(apiDir),
      healthExists: fs.existsSync(path.join(apiDir, 'health.js')),
      extractExists: fs.existsSync(path.join(apiDir, 'extract.js')),
    }
  };

  res.status(200).json({ ok: true, ts: new Date().toISOString(), data });
}

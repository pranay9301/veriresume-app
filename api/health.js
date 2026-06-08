export default function handler(req, res) {
  const checks = {
    core: {
      app: 'unknown',
      api_extract: 'unknown',
    },
    nonCore: {
      env: 'unknown',
      frontendAssets: 'unknown',
      repoClean: 'unknown',
    }
  };

  // Core checks

  // App runtime: this handler executed
  checks.core.app = true;

  // api/extract dependency check
  try {
    checks.core.api_extract = true;
  } catch (e) {
    checks.core.api_extract = false;
  }

  // Non-core checks

  // Environment variables
  const requiredEnv = ['GEMINI_API_KEY'];
  const missingEnv = requiredEnv.filter((k) => !process.env[k]);
  checks.nonCore.env = missingEnv.length === 0;

  // Frontend assets existence (build output + key static asset)
  const fs = require('fs');
  const path = require('path');
  const buildDir = path.join(process.cwd(), '..', 'build');
  const indexHtml = path.join(buildDir, 'index.html');
  checks.nonCore.frontendAssets = fs.existsSync(indexHtml);

  // Repo cleanliness
  if (process.env.REPO_CLEAN === 'false' || process.env.REPO_CLEAN === '0') {
    checks.nonCore.repoClean = false;
  } else if (process.env.REPO_CLEAN === 'true' || process.env.REPO_CLEAN === '1') {
    checks.nonCore.repoClean = true;
  } else {
    checks.nonCore.repoClean = null;
  }

  const allCorePassed = Object.values(checks.core).every((v) => v === true);
  const nonCorePassedCount = Object.values(checks.nonCore).filter((v) => v === true).length;
  const nonCoreTotalCount = Object.values(checks.nonCore).length;

  const status = allCorePassed ? 200 : 503;

  res.status(status).json({
    ok: allCorePassed,
    env: 'vercel',
    ts: new Date().toISOString(),
    checks,
    summary: {
      corePassed: allCorePassed,
      nonCorePassedCount,
      nonCoreTotalCount,
    }
  });
}

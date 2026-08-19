import mongoose from 'mongoose';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRAPE_INTERVAL_HOURS = 2;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
let scrapeRunning = false;
let currentChild = null;
let userStopped = false;

export async function getLastScrapeTime() {
  try {
    const db = mongoose.connection.db;
    if (!db) return null;
    const col = db.collection('scrape_meta');
    const doc = await col.findOne({ key: 'last_scrape' });
    return doc?.timestamp ? new Date(doc.timestamp) : null;
  } catch { return null; }
}

export async function setLastScrapeTime(date) {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const col = db.collection('scrape_meta');
    await col.updateOne(
      { key: 'last_scrape' },
      { $set: { timestamp: date || new Date(), updated_at: new Date() } },
      { upsert: true },
    );
  } catch { /* ignore */ }
}

export async function shouldScrape() {
  const last = await getLastScrapeTime();
  if (!last) return true;
  const elapsed = (Date.now() - last.getTime()) / (1000 * 60 * 60);
  return elapsed >= SCRAPE_INTERVAL_HOURS;
}

export function isScrapingRunning() {
  return scrapeRunning;
}

export function triggerScrape(keywords, locations, platforms) {
  userStopped = false;
  scrapeRunning = true;
  return new Promise((resolve) => {
    const scraperDir = path.join(__dirname, '..', '..', 'jobs_scraper');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const args = ['run.py', '--once'];
    if (platforms?.length) args.push(`--platforms=${platforms.join(',')}`);
    if (keywords?.length) args.push(`--keywords=${keywords.join(',')}`);
    if (locations?.length) args.push(`--locations=${locations.join(',')}`);

    currentChild = spawn(pythonCmd, args, {
      cwd: scraperDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUTF8: '1' },
    });

    let stdout = '';
    currentChild.stdout.on('data', (d) => {
      const line = d.toString().trim();
      stdout += line + '\n';
      if (line) console.log(`[scraper] ${line}`);
    });
    currentChild.stderr.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.error(`[scraper] ${line}`);
    });

    function finish(result) {
      scrapeRunning = false;
      currentChild = null;
      resolve(result);
    }

    const timeout = setTimeout(() => {
      if (currentChild) {
        currentChild.kill('SIGKILL');
        console.warn('[scraper] Killed after timeout');
      }
      finish({ success: false, timedOut: true, stdout: stdout.slice(-2000) });
    }, 1800000);

    currentChild.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        setLastScrapeTime(new Date());
        console.log(`[scraper] Completed (exit 0)`);
        finish({ success: true, stdout: stdout.slice(-2000) });
      } else if (code === null) {
        console.log('[scraper] Killed by user');
        finish({ success: false, killed: true, stdout: stdout.slice(-2000) });
      } else {
        console.warn(`[scraper] Failed (exit ${code})`);
        finish({ success: false, exitCode: code, stdout: stdout.slice(-2000) });
      }
    });

    currentChild.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`[scraper] Error: ${err.message}`);
      finish({ success: false, error: err.message });
    });
  });
}

export function stopScrape() {
  if (currentChild) {
    console.log('[scraper] Stopping by user request...');
    currentChild.kill('SIGKILL');
    currentChild = null;
    scrapeRunning = false;
  }
  userStopped = true;
  return true;
}

export function isUserStopped() {
  return userStopped;
}

export function clearUserStopped() {
  userStopped = false;
}

export function restartScrape(keywords, locations, platforms) {
  stopScrape();
  return triggerScrape(keywords, locations, platforms);
}

export let lastCheckTime = 0;

export async function checkAndTriggerScrape() {
  if (scrapeRunning) return { triggered: false, reason: 'already_running' };
  if (userStopped) return { triggered: false, reason: 'user_stopped' };

  const needs = await shouldScrape();
  if (!needs) return { triggered: false, reason: 'not_due' };

  scrapeRunning = true;
  lastCheckTime = Date.now();
  console.log('[scraper] Auto-triggering scrape (2h interval reached)...');
  const result = await triggerScrape();
  scrapeRunning = false;
  return { triggered: true, result };
}

let intervalHandle = null;

export async function startAutoScheduler() {
  if (intervalHandle) return;

  // Wait for MongoDB connection
  for (let i = 0; i < 30; i++) {
    if (mongoose.connection.db) break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  const last = await getLastScrapeTime();
  if (!last) {
    console.log('[scheduler] No previous scrape found. Triggering immediate first scrape...');
    scrapeRunning = true;
    triggerScrape().then((r) => {
      scrapeRunning = false;
      if (r.success) console.log('[scheduler] First scrape completed');
      else console.warn('[scheduler] First scrape failed', r.exitCode);
    });
  } else {
    checkAndTriggerScrape();
  }

  intervalHandle = setInterval(checkAndTriggerScrape, CHECK_INTERVAL_MS);
  console.log(`[scheduler] Auto-scrape every ${CHECK_INTERVAL_MS / 60000}min, interval ${SCRAPE_INTERVAL_HOURS}h`);
}

export function stopAutoScheduler() {
  if (intervalHandle) { clearInterval(intervalHandle); intervalHandle = null; }
}

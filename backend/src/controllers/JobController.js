import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { triggerScrape, stopScrape, restartScrape, checkAndTriggerScrape, getLastScrapeTime, lastCheckTime, isScrapingRunning } from '../utils/scrapeScheduler.js';

export const getJobs = asyncHandler(async (req, res) => {
  const { platform, keyword, location, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (platform) filter.source = platform;
  if (keyword) {
    const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const r = { $regex: esc, $options: 'i' };
    filter.$or = [{ title: r }, { company: r }, { location: r }, { description: r }];
  }
  if (location) filter.location = { $regex: location, $options: 'i' };

  const db = mongoose.connection.db;
  if (!db) {
    return res.status(503).json(new ApiResponse(503, 'Database not connected'));
  }

  checkAndTriggerScrape();

  const col = db.collection('jobs');
  const skip = (Math.max(1, Number(page)) - 1) * Math.min(Number(limit) || 50, 200);

  const [jobs, total, lastScrape] = await Promise.all([
    col.find(filter).sort({ posted_date: -1 }).skip(skip).limit(Math.min(Number(limit) || 50, 200)).toArray(),
    col.countDocuments(filter),
    getLastScrapeTime(),
  ]);

  const sanitized = jobs.map((j) => {
    const { _id, ...rest } = j;
    return { id: _id.toString(), ...rest };
  });

  res.status(200).json(new ApiResponse(200, 'Jobs retrieved', {
    jobs: sanitized,
    total,
    page: Math.max(1, Number(page)),
    pages: Math.ceil(total / Math.min(Number(limit) || 50, 200)),
    lastScrapeAt: lastScrape?.toISOString() || null,
  }));
});

export const getPlatforms = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  if (!db) {
    return res.status(503).json(new ApiResponse(503, 'Database not connected'));
  }

  const col = db.collection('jobs');
  const platforms = await col.distinct('source');
  res.status(200).json(new ApiResponse(200, 'Platforms retrieved', platforms));
});

export const scrapeJobs = (req, res) => {
  const { keywords, locations, platforms } = req.body;
  triggerScrape(keywords, locations, platforms);
  res.status(202).json(new ApiResponse(202, 'Scrape started in background'));
};

export const exportJobsCsv = asyncHandler(async (req, res) => {
  const { platform, keyword } = req.query;
  const filter = {};

  if (platform) filter.source = platform;
  if (keyword) {
    const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: esc, $options: 'i' } },
      { company: { $regex: esc, $options: 'i' } },
      { location: { $regex: esc, $options: 'i' } },
    ];
  }

  const db = mongoose.connection.db;
  if (!db) {
    return res.status(503).json({ success: false, message: 'Database not connected' });
  }

  const col = db.collection('jobs');
  const jobs = await col.find(filter).sort({ posted_date: -1 }).toArray();

  const headers = ['Title', 'Company', 'Location', 'Email', 'Source', 'Salary Min', 'Salary Max', 'Posted Date', 'Description', 'Application URL', 'Employment Type', 'Skills'];
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };

  let csv = '\uFEFF' + headers.join(',') + '\n';
  for (const j of jobs) {
    const row = [
      escape(j.title),
      escape(j.company),
      escape(j.location),
      escape(j.email || ''),
      escape(j.source),
      j.salary_min ?? '',
      j.salary_max ?? '',
      j.posted_date ? new Date(j.posted_date).toISOString().split('T')[0] : '',
      escape((j.description || '').replace(/<[^>]*>/g, '').substring(0, 500)),
      escape(j.application_url || ''),
      escape(j.employment_type || ''),
      escape(j.skills || ''),
    ];
    csv += row.join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=jobs-export-${Date.now()}.csv`);
  res.status(200).send(csv);
});

export const getLastScrape = asyncHandler(async (req, res) => {
  const last = await getLastScrapeTime();
  res.status(200).json(new ApiResponse(200, 'Last scrape time', {
    lastScrapeAt: last?.toISOString() || null,
    isRunning: false,
  }));
});

export const getJobAnalytics = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  if (!db) {
    return res.status(503).json(new ApiResponse(503, 'Database not connected'));
  }

  const col = db.collection('jobs');

  const [totalJobs, platformStats, emailStats, lastScrape, dailyTrend] = await Promise.all([
    col.countDocuments(),
    col.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),
    col.aggregate([
      { $group: { _id: { $cond: [{ $ifNull: ['$email', false] }, 'with_email', 'without_email'] }, count: { $sum: 1 } } },
    ]).toArray(),
    col.find().sort({ scraped_at: -1 }).limit(1).project({ scraped_at: 1 }).toArray(),
    col.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$scraped_at' } }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 7 },
    ]).toArray(),
  ]);

  const withEmail = emailStats.find((e) => e._id === 'with_email')?.count || 0;
  const withoutEmail = emailStats.find((e) => e._id === 'without_email')?.count || 0;

  res.status(200).json(new ApiResponse(200, 'Job analytics retrieved', {
    totalJobs,
    platforms: platformStats.map((p) => ({ platform: p._id, count: p.count })),
    emailsFound: withEmail,
    emailsMissing: withoutEmail,
    lastScrapeAt: lastScrape[0]?.scraped_at?.toISOString() || null,
    dailyTrend: dailyTrend.map((d) => ({ date: d._id, count: d.count })),
  }));
});

export const stopScrapeHandler = asyncHandler(async (req, res) => {
  const killed = stopScrape();
  res.status(200).json(new ApiResponse(200, killed ? 'Scrape stopped' : 'No scrape running', { killed }));
});

export const restartScrapeHandler = asyncHandler(async (req, res) => {
  const { keywords, locations, platforms } = req.body;
  stopScrape();
  triggerScrape(keywords, locations, platforms);
  res.status(202).json(new ApiResponse(202, 'Scrape restarting'));
});

export const getScrapingStatus = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Scraping status', {
    scraping: isScrapingRunning(),
  }));
});

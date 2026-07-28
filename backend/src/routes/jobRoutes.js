import { Router } from 'express';
import { getJobs, getPlatforms, scrapeJobs, exportJobsCsv, getLastScrape, getJobAnalytics, getScrapingStatus, stopScrapeHandler, restartScrapeHandler } from '../controllers/JobController.js';

const router = Router();

router.get('/', getJobs);
router.get('/analytics', getJobAnalytics);
router.get('/platforms', getPlatforms);
router.get('/export', exportJobsCsv);
router.get('/last-scrape', getLastScrape);
router.get('/scraping-status', getScrapingStatus);
router.post('/scrape', scrapeJobs);
router.post('/stop', stopScrapeHandler);
router.post('/restart', restartScrapeHandler);

export default router;

import { Router } from 'express';
import { getJobs, getPlatforms, scrapeJobs, exportJobsCsv, getLastScrape, getJobAnalytics } from '../controllers/JobController.js';

const router = Router();

router.get('/', getJobs);
router.get('/analytics', getJobAnalytics);
router.get('/platforms', getPlatforms);
router.get('/export', exportJobsCsv);
router.get('/last-scrape', getLastScrape);
router.post('/scrape', scrapeJobs);

export default router;

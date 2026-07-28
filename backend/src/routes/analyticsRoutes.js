import { Router } from 'express';
import { getAnalytics } from '../controllers/AnalyticsController.js';

const router = Router();

router.get('/', getAnalytics);

export default router;

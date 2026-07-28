import { Router } from 'express';
import settingsRoutes from './settingsRoutes.js';
import resumeRoutes from './resumeRoutes.js';
import coverLetterRoutes from './coverLetterRoutes.js';
import emailRoutes from './emailRoutes.js';
import templateRoutes from './templateRoutes.js';
import logRoutes from './logRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import jobRoutes from './jobRoutes.js';

const router = Router();

router.use('/settings', settingsRoutes);
router.use('/resume', resumeRoutes);
router.use('/cover-letter', coverLetterRoutes);
router.use('/', emailRoutes);
router.use('/templates', templateRoutes);
router.use('/logs', logRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/jobs', jobRoutes);

export default router;

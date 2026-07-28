import { Router } from 'express';
import { upload, getResume, deleteResume } from '../controllers/ResumeController.js';
import { uploadResume } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/upload', uploadResume, upload);
router.get('/', getResume);
router.delete('/', deleteResume);

export default router;

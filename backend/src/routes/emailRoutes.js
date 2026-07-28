import { Router } from 'express';
import { sendEmails, testSmtp, pauseSending, resumeSending, cancelSending, uploadCsv } from '../controllers/EmailController.js';
import recipientValidator from '../validators/recipientValidator.js';
import validate from '../middlewares/validateMiddleware.js';
import { uploadCsv as csvMiddleware } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/send', validate(recipientValidator), sendEmails);
router.post('/test-smtp', testSmtp);
router.post('/pause', pauseSending);
router.post('/resume', resumeSending);
router.post('/cancel', cancelSending);
router.post('/upload-csv', csvMiddleware, uploadCsv);

export default router;

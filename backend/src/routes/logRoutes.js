import { Router } from 'express';
import { getLogs, deleteLogs, exportCSV, exportExcel } from '../controllers/LogController.js';

const router = Router();

router.get('/', getLogs);
router.delete('/', deleteLogs);
router.get('/export/csv', exportCSV);
router.get('/export/excel', exportExcel);

export default router;

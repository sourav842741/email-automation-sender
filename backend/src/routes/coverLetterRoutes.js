import { Router } from 'express';
import { save, getAll, getById, update, setActive, remove } from '../controllers/CoverLetterController.js';
import { uploadCoverLetter } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/', uploadCoverLetter, save);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', update);
router.put('/:id/active', setActive);
router.delete('/:id', remove);

export default router;

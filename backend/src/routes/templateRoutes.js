import { Router } from 'express';
import { create, getAll, update, delete_ } from '../controllers/TemplateController.js';
import templateValidator from '../validators/templateValidator.js';
import validate from '../middlewares/validateMiddleware.js';

const router = Router();

router.post('/', validate(templateValidator), create);
router.get('/', getAll);
router.put('/:id', validate(templateValidator), update);
router.delete('/:id', delete_);

export default router;

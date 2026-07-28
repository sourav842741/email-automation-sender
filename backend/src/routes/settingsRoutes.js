import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/SettingsController.js';
import settingsValidator from '../validators/settingsValidator.js';
import validate from '../middlewares/validateMiddleware.js';

const router = Router();

router.get('/', getSettings);
router.put('/', validate(settingsValidator), updateSettings);

export default router;

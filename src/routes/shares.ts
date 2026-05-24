import { Router } from 'express';
import { createShare, viewShare } from '../controllers/sharesController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/share/:id', requireAuth, createShare);
router.get('/share/:token', viewShare);

export default router;
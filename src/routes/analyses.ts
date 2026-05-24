import { Router} from 'express';
import { analyzeRepo } from '../controllers/analysesController.js';
import { requireAuth} from '../middleware/authMiddleware.js';


const router = Router();

router.post('/analyze', requireAuth, analyzeRepo);

export default router;
import { Router} from 'express';
import { analyzeRepo, listAnalyses } from '../controllers/analysesController.js';
import { requireAuth} from '../middleware/authMiddleware.js';


const router = Router();

router.post('/analyze', requireAuth, analyzeRepo);
router.get('/analyses', requireAuth, listAnalyses);

export default router;
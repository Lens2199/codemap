import { Router} from 'express';
import { analyzeRepo, listAnalyses , getAnalysis } from '../controllers/analysesController.js';
import { requireAuth} from '../middleware/authMiddleware.js';


const router = Router();

router.post('/analyze', requireAuth, analyzeRepo);
router.get('/analyses', requireAuth, listAnalyses);
router.get('/analyses/:id', requireAuth, getAnalysis);

export default router;
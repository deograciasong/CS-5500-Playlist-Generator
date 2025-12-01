import express from 'express';
import aiRouter from '../controllers/ai-generator.controller.js';
const router = express.Router();
// Mount controller routes at the root of this router.
router.use('/', aiRouter);
export default router;
//# sourceMappingURL=ai.js.map
import { Router } from 'express';
const verifyEmailRouter = Router();

import verifyAdminEmail from '../controllers/verify-email.js';

verifyEmailRouter.route("/").post(verifyAdminEmail);

export default verifyEmailRouter;
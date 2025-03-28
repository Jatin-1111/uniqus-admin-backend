import { Router } from 'express';
const authRouter = Router();

import {
    login,
    home,
    checkAuth,
    logout,
    registerRoot,
    createAssociateUser,
    loginAssociateUser,
    createInstituteAdmin,
    getAssociates,
    saveInstituteDraft,
    submitInstituteApplication,
    // getAssociateInstituteDrafts,
    // refreshDocumentUrl,
    // getInstituteDocuments,
    saveDocumentMetadata,
    getDocumentAccessUrl,
    getAssociateInstitutes,
    getInstituteById,
    getAllInstitutes,
    getInstituteDocuments,
    // generatePresignedUrl,
} from '../controllers/auth-controller.js';
import authMiddleware from '../middleware/auth-middleware.js';
import { generateSignedUrl } from '../controllers/file-upload.js';
import verifyAdminEmail from '../controllers/verify-email.js';


// General routes
authRouter.route("/").get(home);
authRouter.route("/check-auth").get(authMiddleware, checkAuth);

// Authentication routes
authRouter.route("/adjudicator-login").post(login);
authRouter.route("/register-root").post(registerRoot);
authRouter.route("/logout").post(authMiddleware, logout);

// Associate user management routes
authRouter.route("/create-associate").post(authMiddleware, createAssociateUser);
authRouter.route("/associate-login").post(loginAssociateUser);
authRouter.route("/get-associates").get(authMiddleware, getAssociates);

// Institute management routes
authRouter.route("/associate/institutes/admin").post(createInstituteAdmin);
authRouter.route("/associate/institutes/draft").post(authMiddleware, saveInstituteDraft);
authRouter.route("/associate/:associateId/institutes").get(

    // authMiddleware, 
    getAssociateInstitutes);

// authRouter.route("/associate/institutes/:instituteId/documents").post(addInstituteDocuments);


// For retrieving document
authRouter.route("/associate/institutes/:instituteId/documents")
    .get(getInstituteDocuments);

// For refreshing a document's access URL
// authRouter.route("/associate/institutes/:instituteId/documents/:documentId/refresh-url")
//     .get(refreshDocumentUrl);

// Document Upload routes
authRouter.get('/institutes/:instituteId/generateUrl', generateSignedUrl);

authRouter.post('/institutes/:instituteId/documents/metadata', saveDocumentMetadata);

authRouter.get('/institutes/:instituteId/documents/:documentId/access-url', authMiddleware, getDocumentAccessUrl);

authRouter.route('/otp/request').post(verifyAdminEmail)

authRouter.route("/associate/institutes/:instituteId/submit").post(submitInstituteApplication);


authRouter.route("/associate/institutes/:instituteId").get(getInstituteById);

authRouter.route("/adjudicator/institutes").get(
    // authMiddleware,
    getAllInstitutes
)


export default authRouter;

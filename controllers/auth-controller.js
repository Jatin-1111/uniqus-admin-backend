import Adjudicator from "../models/Adjudicator.js";
import AssociateUser from "../models/AssociateUser.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import OTP from '../models/OTP.js';
import InstituteAdmin from "../models/Admin.js";
import mongoose from "mongoose";
import Institute from "../models/InstituteSchema.js";
import InstituteDocument from "../models/InstituteDocuments.js";
import { s3 } from "./file-upload.js";

// JWT secret keys
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
// const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

//Home page
const home = async (req, res) => {
    try {
        res.status(200).send("It's Backend Darling 😎");
    } catch (error) {
        console.log(error);
    }
}

// Adjudicator Login Logic
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const adjudicator = await Adjudicator.findOne(
            { email },
            { email: 1, password: 1 }
        );

        if (!adjudicator) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isPasswordValid = await adjudicator.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Generate token for logged in user
        const token = await adjudicator.generateToken();

        // Get only necessary user data to return
        const userData = {
            _id: adjudicator._id,
            email: adjudicator.email
        };

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            token: token,
            userId: adjudicator._id.toString(),
            data: userData
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

// Adjudicator creation logic
const registerRoot = async (req, res) => {
    try {
        const rootExists = await Adjudicator.findOne({}, { _id: 1 }).limit(1);

        if (rootExists) {
            return res.status(400).json({
                success: false,
                message: "Root adjudicator already exists"
            });
        }

        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await Adjudicator.create({
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: "Root adjudicator created successfully",
            userId: result._id.toString()
        });

    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during registration: " + error.message
        });
    }
};

// Authentication Logic
const checkAuth = async (req, res) => {
    try {
        // If middleware passed, user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed - user not found in request"
            });
        }

        // Get user role - helpful for frontend authorization
        let userType = 'unknown';
        if (req.user.adjudicatorId) {
            userType = 'adjudicator';
        } else if (req.user.adminId) {
            userType = 'admin';
        } else if (req.user.userId) {
            userType = 'associateUser';
        }

        // Filter sensitive information from user object
        const filteredUser = { ...req.user };
        delete filteredUser.password;
        delete filteredUser.iat;
        delete filteredUser.exp;

        return res.status(200).json({
            success: true,
            isAuthenticated: true,
            userType,
            user: filteredUser,
            message: "User authenticated successfully"
        });
    } catch (error) {
        console.error("Check auth error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while checking authentication"
        });
    }
};

// Register a new associate user
const createAssociateUser = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        if (!name || !email || !password || !phone || !address) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        const existingUser = await AssociateUser.findOne({ email }, { _id: 1 }).lean();

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await AssociateUser.create({
            name,
            email,
            password,
            phone,
            address
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            newUser: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Login Associate User
const loginAssociateUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all fields'
            });
        }

        const user = await AssociateUser.findOne({ email }, { _id: 1, password: 1, name: 1, email: 1 });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate a single token to match format expected by frontend
        const token = jwt.sign({ userId: user._id }, ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

        // Format user data
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email
        };

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            token: token,  // Use same field name as adjudicator login
            userId: user._id.toString(),
            data: userData
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get Associate Users
const getAssociates = async (req, res) => {
    try {
        const associateUsers = await AssociateUser.find({}).select('_id name email');
        return res.status(200).json({
            success: true,
            data: associateUsers
        });
    } catch (error) {
        console.error("Unable to fetch the associate users", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching associate users",
        });
    }
}

// Register an Institute
// Step 1: Save basic institute details (draft)
const saveInstituteDraft = async (req, res) => {
    try {
        const {
            name, address, description, InitialStudentCount,
            InitialteacherCount, remark, city, instituteId, associateId
        } = req.body;

        console.log({
            name, address, description, InitialStudentCount,
            InitialteacherCount, remark, city, instituteId, associateId
        });

        const associateUserId = associateId; // Assuming you have authentication middleware

        // If instituteId exists, update existing draft
        if (instituteId) {
            const institute = await Institute.findById(instituteId);

            if (!institute) {
                return res.status(404).json({
                    success: false,
                    message: 'Draft not found'
                });
            }

            // Check if user is authorized to update this draft
            if (institute.createdBy.toString() !== associateUserId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this draft'
                });
            }

            // Update draft
            const updatedInstitute = await Institute.findByIdAndUpdate(
                instituteId,
                {
                    name, address, description, InitialStudentCount,
                    InitialteacherCount, remark, city,
                    status: 'Incomplete'
                },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: 'Draft updated successfully',
                institute: updatedInstitute
            });
        } else {
            // Create new draft
            const newInstitute = await Institute.create({
                name,
                address,
                description,
                InitialStudentCount,
                InitialteacherCount,
                remark,
                city,
                createdBy: associateUserId,
                status: 'Incomplete'
            });


            return res.status(201).json({
                success: true,
                message: 'Draft saved successfully',
                institute: newInstitute
            });
        }
    } catch (error) {
        console.error('Error saving draft:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save draft',
            error: error.message
        });
    }
};

// // Step 2: Upload documents
// const addInstituteDocuments = async (req, res) => {
//     try {
//         const { instituteId } = req.params;
//         const files = req.files; // Assuming you're using a file upload middleware

//         const institute = await Institute.findById(instituteId);

//         if (!institute) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Institute draft not found'
//             });
//         }

//         // Upload files and create document records
//         const documentPromises = files.map(async (file) => {
//             // Handle file upload to your storage (S3, etc.)
//             const fileUrl = ''; // Replace with actual file URL after upload

//             const document = await InstituteDocument.create({
//                 fileName: file.originalname,
//                 fileUrl,
//                 institute: instituteId
//             });

//             return document._id;
//         });

//         const documentIds = await Promise.all(documentPromises);

//         // Update institute with document references
//         institute.documents = [...institute.documents, ...documentIds];
//         await institute.save();

//         return res.status(200).json({
//             success: true,
//             message: 'Documents uploaded successfully',
//             documents: documentIds
//         });
//     } catch (error) {
//         console.error('Error uploading documents:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Failed to upload documents',
//             error: error.message
//         });
//     }
// };

// POST /api/institutes/:instituteId/documents/metadata
export const saveDocumentMetadata = async (req, res) => {
    try {
        const { instituteId } = req.params;
        const { documents } = req.body;

        // Find the institute
        const institute = await Institute.findById(instituteId);

        if (!institute) {
            return res.status(404).json({ message: 'Institute not found' });
        }

        const savedDocuments = [];

        for (const doc of documents) {
            // Generate access URL with maximum allowed expiry (7 days)
            const accessUrl = s3.getSignedUrl('getObject', {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: doc.key,
                Expires: 7 * 24 * 60 * 60 // 7 days (maximum allowed)
            });

            // Create document record
            const savedDoc = await InstituteDocument.create({
                instituteId,
                fileName: doc.fileName,
                accessUrl,
                uploadedAt: new Date()
            });

            // Update institute's documents array
            if (!institute.documents) {
                institute.documents = [];
            }
            institute.documents.push(savedDoc._id);

            savedDocuments.push(savedDoc);
        }

        // Save the institute
        await institute.save();

        res.status(201).json({
            success: true,
            documents: savedDocuments
        });
    } catch (error) {
        console.error('Error saving document metadata:', error);
        res.status(500).json({
            message: 'Failed to save document metadata',
            error: error.message
        });
    }
}

// GET /api/institutes/:instituteId/documents/:documentId/access-url
export const getDocumentAccessUrl = async (req, res) => {
    try {
        const { instituteId, documentId } = req.params;

        // Find document
        const document = await InstituteDocument.findOne({
            _id: documentId,
            instituteId
        });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Simply return the existing access URL
        res.status(200).json({
            success: true,
            accessUrl: document.accessUrl
        });
    } catch (error) {
        console.error('Error getting document access URL:', error);
        res.status(500).json({
            message: 'Failed to get document access URL',
            error: error.message
        });
    }
}

export const refreshAccessUrl = async (req, res) => {
    try {
        const { documentId } = req.params;

        // Find the document
        const document = await InstituteDocument.findById(documentId);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Generate a new access URL
        const accessUrl = s3.getSignedUrl('getObject', {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: document.key,
            Expires: 7 * 24 * 60 * 60 // 7 days
        });

        // Update the document
        document.accessUrl = accessUrl;
        await document.save();

        res.status(200).json({
            success: true,
            accessUrl
        });
    } catch (error) {
        console.error('Error refreshing access URL:', error);
        res.status(500).json({
            message: 'Failed to refresh access URL',
            error: error.message
        });
    }
}

// export const getInstituteDocuments = async (req, res) => {
//     try {
//         const { instituteId } = req.params;

//         // Fetch all documents for the institute
//         let documents = await InstituteDocument.find({ instituteId });

//         // Check if any document URLs need refreshing
//         const refreshedDocuments = [];

//         for (const doc of documents) {
//             if (doc.isUrlExpired()) {
//                 // Refresh URL if expired
//                 doc.accessUrl = await generateAccessUrl(doc.key, 7 * 86400);
//                 doc.urlExpiry = new Date();
//                 doc.urlExpiry.setDate(doc.urlExpiry.getDate() + 7);
//                 await doc.save();
//                 refreshedDocuments.push(doc);
//             }
//         }

//         // If any documents were refreshed, refetch the complete list
//         if (refreshedDocuments.length > 0) {
//             documents = await InstituteDocument.find({ instituteId });
//         }

//         res.status(200).json({
//             success: true,
//             documents
//         });
//     } catch (error) {
//         console.error('Error fetching institute documents:', error);
//         res.status(500).json({ message: 'Failed to fetch institute documents' });
//     }
// };

// Step 3: Register an Institute Admin
const createInstituteAdmin = async (req, res) => {
    try {
        const { name, email, password, phone, address, otp, instituteId, identificationDoc } = req.body;

        // Validate required fields
        if (!name || !email || !password || !phone || !address || !otp || !instituteId) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }

        // Check if identification document is provided
        if (!identificationDoc || !identificationDoc.fileName || !identificationDoc.accessUrl) {
            return res.status(400).json({
                success: false,
                message: 'Please upload identification document'
            });
        }

        // Verify institute exists and is in draft state
        const institute = await Institute.findById(instituteId);
        if (!institute) {
            return res.status(404).json({
                success: false,
                message: "Institute not found"
            });
        }

        // Verify OTP
        const latestOtp = await OTP.findOne({ email, user: 'Admin' })
            .sort({ createdAt: -1 })
            .select('otp')
            .lean();

        if (!latestOtp) {
            return res.status(404).json({
                success: false,
                message: "No OTP found for email"
            });
        }

        if (otp !== latestOtp.otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Check for existing admin
        const existingAdmin = await InstituteAdmin.findOne({
            $or: [{ email }, { phone }]
        }, { _id: 1, phone: 1, email: 1 }).lean();

        if (existingAdmin) {
            const message = existingAdmin.phone === phone
                ? 'Phone number already exists'
                : existingAdmin.email === email
                    ? 'Email already exists'
                    : 'Admin already exists';
            return res.status(400).json({
                success: false,
                message
            });
        }

        // Use a transaction for atomic operations
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Hash password before saving
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create admin with identification document
            const newAdmin = await InstituteAdmin.create([{
                name,
                email,
                password: hashedPassword,
                phone,
                address,
                identificationDoc: {
                    fileName: identificationDoc.fileName,
                    accessUrl: identificationDoc.accessUrl,
                    uploadedAt: new Date()
                },
                organizations: [instituteId] // Associate with institute
            }], { session });

            // Update institute with admin reference
            await Institute.findByIdAndUpdate(
                instituteId,
                {
                    Admin: newAdmin[0]._id,
                    status: 'Incomplete' // Keep as draft until final submission
                },
                { session }
            );

            // Delete used OTP
            await OTP.deleteOne({ _id: latestOtp._id }, { session });

            await session.commitTransaction();

            return res.status(201).json({
                success: true,
                message: 'Admin registered successfully',
                adminId: newAdmin[0]._id
            });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error("Admin registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
};

// Step 4: Submit complete application
const submitInstituteApplication = async (req, res) => {
    try {
        const { instituteId } = req.params;

        const institute = await Institute.findById(instituteId);

        if (!institute) {
            return res.status(404).json({
                success: false,
                message: 'Institute not found'
            });
        }

        // Validate all required fields are present
        if (!institute.name || !institute.address || !institute.description ||
            !institute.city || !institute.documents.length || !institute.Admin) {
            return res.status(400).json({
                success: false,
                message: 'Please complete all required sections before submitting'
            });
        }

        // Update status to Pending for review
        institute.status = 'Pending';
        await institute.save();

        return res.status(200).json({
            success: true,
            message: 'Institute application submitted successfully',
            institute
        });
    } catch (error) {
        console.error('Error submitting application:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit application',
            error: error.message
        });
    }
};

// Get draft institutes for an associate user
export const getAssociateInstitutes = async (req, res) => {
    try {

        const associateUserId = req.params.associateId || req.query.associateId || req.body.associateId;

        // Fetch all institutes created by this associate user, regardless of status
        const institutes = await Institute.find({
            createdBy: associateUserId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            institutes
        });
    } catch (error) {
        console.error('Error fetching institutes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch institutes',
            error: error.message
        });
    }
};

export const getInstituteById = async (req, res) => {
    try {
        const instituteId = req.params.instituteId ?? req.query.instituteId ?? req.body.instituteId;

        if (!instituteId) {
            return res.status(400).json({
                success: false,
                message: 'Institute ID is required'
            });
        }
        const institute = await Institute.findById(instituteId).lean();

        if (!institute) {
            return res.status(404).json({
                success: false,
                message: 'Institute not found'
            });
        }

        // Return the response with the institute data
        return res.status(200).json({
            success: true,
            institute
        });
    } catch (error) {
        // Check if error is a CastError (invalid ObjectId format)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid institute ID format'
            });
        }

        console.error('Error fetching institute:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch institute',
            error: error.message
        });
    }
};

export const getAllInstitutes = async (req, res) => {
    try {
        const institutes = await Institute.find({}, '-__v').lean();

        res.status(200).json({ success: true, institutes });
    } catch (error) {
        console.error('Error fetching institutes:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch institutes',
        });
    }
};

export const getInstituteDocuments = async (req, res) => {
    try {
        const instituteId = req.params.instituteId;

        if (!instituteId) {
            return res.status(400).json({
                success: false,
                message: 'Institute ID is required'
            });
        }

        // Assuming Document model has instituteId field
        const documents = await InstituteDocument.find({ instituteId }).lean();

        if (!documents || documents.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No documents found for this institute'
            });
        }

        return res.status(200).json({
            success: true,
            documents
        });
    } catch (error) {
        console.error('Error fetching institute documents:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

//logout logic
const logout = async (req, res) => {
    try {
        // No need to check user again as middleware already did
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during logout"
        });
    }
};

export {
    home,
    login,
    checkAuth,
    logout,
    registerRoot,
    loginAssociateUser,
    createAssociateUser,
    createInstituteAdmin,
    getAssociates,
    saveInstituteDraft,
    submitInstituteApplication,
};
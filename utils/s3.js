import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';



// Initialize the S3 client
export const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// export const uploadFileToS3 = async (file, folder = 'institute-documents') => {
//     try {
//         // Generate a unique filename to avoid collisions
//         const uniqueFileName = `${folder}/${Date.now()}-${uuidv4()}-${path.basename(file.originalname).replace(/\s+/g, '-')}`;

//         // Read the file content
//         const fileContent = await fs.readFile(file.path);

//         // Set up the parameters for S3 upload
//         const params = {
//             Bucket: BUCKET_NAME,
//             Key: uniqueFileName, // need to pass _id
//             Body: fileContent,
//             ContentType: file.mimetype
//         };

//         // Upload the file to S3
//         const command = new PutObjectCommand(params);
//         await s3Client.send(command);

//         // Generate the URL for the file
//         const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

//         // Clean up the temporary file
//         await fs.unlink(file.path).catch(err => console.warn('File cleanup warning:', err));

//         return fileUrl;
//     } catch (error) {
//         console.error('Error uploading file to S3:', error);
//         throw new Error(`Failed to upload file to S3: ${error.message}`);
//     }
// };

export const uploadFileToS3 = async (file, id, baseFolder = 'institute-documents') => {
    try {
        if (!id) {
            throw new Error('ID is required to create the folder structure');
        }

        // Create a folder structure using the ID
        const folderPath = `${baseFolder}/${id}`;

        // Generate a unique filename to avoid collisions
        const uniqueFileName = `${folderPath}/${Date.now()}-${uuidv4()}-${path.basename(file.originalname).replace(/\s+/g, '-')}`;

        // Read the file content
        const fileContent = await fs.readFile(file.path);

        // Set up the parameters for S3 upload
        const params = {
            Bucket: BUCKET_NAME,
            Key: uniqueFileName,
            Body: fileContent,
            ContentType: file.mimetype
        };

        // Upload the file to S3
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        // Generate the URL for the file
        const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

        // Clean up the temporary file
        await fs.unlink(file.path).catch(err => console.warn('File cleanup warning:', err));

        return fileUrl;
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
};


export const generatePresignedUrl = async (id, fileName, contentType, baseFolder = 'institute-documents', expiresIn = 3600) => {
    try {
        if (!id) {
            throw new Error('ID is required to create the folder structure');
        }

        // Create a folder structure using the ID
        const folderPath = `${baseFolder}/${id}`;

        // Generate a unique key for the file
        const key = `${folderPath}/${Date.now()}-${uuidv4()}-${path.basename(fileName).replace(/\s+/g, '-')}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn });

        return {
            url,
            key,
            fileUrl: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
        };
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
};

export default { uploadFileToS3, generatePresignedUrl };
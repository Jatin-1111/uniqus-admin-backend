import AWS from 'aws-sdk'

// Initialize the S3 client
export const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

});

export const generateSignedUrl = async (req, res) => {

    console.log("Bhai log hoja🥹🥹");

    const { instituteId } = req.params;
    const key = `uploads / ${instituteId}/${Date.now()}-${Math.random().toString(36).substring(7)}`;


    // Define the S3 upload parameters
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Expires: 60 * 5,
        ContentType: 'application/pdf', // Hardcoded only for PDF
    };

    // Generate the pre-signed URL
    s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
            return res.status(500).send('Error generating pre-signed URL: ' + err.message);
        }

        // Send the pre-signed URL to the client
        res.status(200).json({
            url: url,
            key
        });
    });
};


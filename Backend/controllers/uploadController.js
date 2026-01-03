import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/aws.js";
import { v4 as uuidv4 } from "uuid";
import materials from "../models/materials.js";

export const generatePresignedUrl = async (req, res) => {
    try {
        const { examId, files } = req.body;
        console.log(req.body);

        if (!examId) {
            return res.status(400).json({ message: "Exam ID is required" });
        }

        // Handle Multiple Files
        if (files && Array.isArray(files) && files.length > 0) {
            const fileUrls = await Promise.all(files.map(async (file) => {
                const fileId = uuidv4();
                const objectKey = `exams/${examId}/materials/${fileId}-${file.fileName}`;
                const command = new PutObjectCommand({
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: objectKey,
                    ContentType: file.fileType,
                });
                const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
                const material = new materials({
                    examId,
                    objectKey,
                })
                await material.save();
                return { fileName: file.fileName, uploadUrl, objectKey };
            }));

            return res.status(200).json({
                success: true,
                message: "Successfully generated presigned URLs",
                fileUrls
            });
        }

        // Handle Single File (Backward Compatibility)
        if (files) {
            const fileId = uuidv4();
            const objectKey = `exams/${examId}/materials/${fileId}-${files.fileName}`;
            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: objectKey,
                ContentType: files.fileType,
            });
            const material = new materials({
                examId,
                objectKey,
            })
            await material.save();

            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
            return res.status(200).json({
                uploadUrl,
                objectKey,
                message: "Successfully generated presigned URL",
                success: true
            });
        }

        return res.status(400).json({ message: "File data (fileName/fileType or files array) is required" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to generate presigned URL", success: false });
    }
};
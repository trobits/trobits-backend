import multer from "multer";
import path from "path";
import fs from "fs";
import AWS from "aws-sdk";

// Define the type for the file upload response from DigitalOcean Spaces
interface UploadResponse extends AWS.S3.ManagedUpload.SendData {
  Location: string; // This will store the formatted URL with "https://"
}

const spacesEndpoint = new AWS.Endpoint(`${process.env.DO_SPACE_ENDPOINT}`);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: `${process.env.DO_SPACE_ACCESS_KEY}`, // Use environment variables for keys
  secretAccessKey: `${process.env.DO_SPACE_SECRET_KEY}`,
});

// Multer storage configuration (local storage before uploading to DigitalOcean)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Upload single video (expected field name 'video' in form-data)
const uploadSingle = upload.single("image");

// Upload file to DigitalOcean Spaces
const uploadToDigitalOcean = async (
  file: Express.Multer.File
): Promise<UploadResponse> => {
  return new Promise((resolve, reject) => {
    // Ensure the file exists before attempting to upload it
    fs.access(file.path, fs.constants.F_OK, (accessError) => {
      if (accessError) {
        console.error(`File not found: ${file.path}`, accessError);
        reject(new Error(`File not found: ${file.path}`));
        return;
      }

      // Prepare file upload parameters
      const params = {
        Bucket: `${process.env.DO_SPACE_BUCKET}`, // Replace with your DigitalOcean Space bucket name
        Key: `crypto-app/${Date.now()}_${file.originalname}`, // File name with timestamp
        Body: fs.createReadStream(file.path),
        ACL: "public-read", // Set permissions, adjust as necessary
        ContentType: file.mimetype, // Ensure correct file type is sent
      };

      // Upload file to DigitalOcean Space
      s3.upload(params, (error: Error, data: AWS.S3.ManagedUpload.SendData) => {
        // <-- Change the error type to `Error`
        if (error) {
          reject(error);
          return;
        }

        // Safely remove the file from local storage after upload
        fs.unlink(file.path, (unlinkError) => {
          if (unlinkError) {
            console.error(`Failed to delete file: ${file.path}`, unlinkError);
          }
        });

        // Format the URL to include "https://"

        // Resolve the promise with the modified URL
        resolve({
          ...data,
          Location: data?.Location, // Return https:// formatted URL
        });
      });
    });
  });
};

export const fileUploader = {
  uploadSingle,
  uploadToDigitalOcean,
};





// import { S3Client, S3ClientConfig, ObjectCannedACL } from "@aws-sdk/client-s3";
// import { Upload } from "@aws-sdk/lib-storage";
// import fs from "fs";
// import path from "path";
// import dotenv from "dotenv";

// dotenv.config();

// // Configure the S3 client for DigitalOcean Spaces
// const s3Config: S3ClientConfig = {
//   endpoint: process.env.DO_SPACE_ENDPOINT,
//   region: process.env.DO_SPACES_REGION,
//   credentials: {
//     accessKeyId: process.env.DO_SPACES_KEY!,
//     secretAccessKey: process.env.DO_SPACES_SECRET!,
//   },
// };

// const s3 = new S3Client(s3Config);

// /**
//  * Uploads a file to DigitalOcean Spaces and returns the file URL.
//  * @param {Express.Multer.File} file - The file object from multer
//  * @returns {Promise<string>} - The URL of the uploaded file
//  */
// export const uploadToDigitalOcean = async (
//   file: Express.Multer.File
// ): Promise<string> => {
//   const fileStream = fs.createReadStream(file.path);
//   const fileName = `crypto-app/${Date.now()}_${path.basename(
//     file.originalname
//   )}`;

//   const uploadParams = {
//     Bucket: process.env.DO_SPACES_NAME,
//     Key: fileName,
//     Body: fileStream,
//     ACL: "public-read" as ObjectCannedACL, // Cast "public-read" to ObjectCannedACL
//     ContentType: file.mimetype,
//   };

//   try {
//     // Using Upload from @aws-sdk/lib-storage
//     const upload = new Upload({
//       client: s3,
//       params: uploadParams,
//     });

//     const data = await upload.done();
//     return (
//       data.Location ||
//       `https://${process.env.DO_SPACES_NAME}.${process.env.DO_SPACE_ENDPOINT}/${fileName}`
//     );
//   } catch (error) {
//     console.error("Error uploading file to DigitalOcean Spaces:", error);
//     throw new Error("Failed to upload file to DigitalOcean Spaces");
//   } finally {
//     fs.unlink(file.path, (err) => {
//       if (err) console.error("Failed to delete local file:", err);
//     });
//   }
// };


// // Export multer and upload function
// export const fileUploader = {
// //   uploadSingle,
//   uploadToDigitalOcean,
// };

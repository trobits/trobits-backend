import fs from "fs";
import path from "path";
import config from "../config";

// export const deleteFile = (imageUrl: string) => {
//   const baseUrl = config.backend_image_url;
//   const relativePath = imageUrl.replace(baseUrl as string, "");
//   const afterRelativePath = relativePath.split("/").slice(1).join("/");
//   const fileName = path.basename(afterRelativePath);
//   const absolutePath = path.join(process.cwd(), "uploads", fileName);

//   if (fs.existsSync(absolutePath)) {
//     fs.unlink(absolutePath, (err) => {
//       if (err) {
//         console.error("Error while deleting file:", err);
//       } else {
//         console.log("File deleted successfully:", absolutePath);
//       }
//     });
//   } else {
//     console.warn("File does not exist at path:", absolutePath);
//   }
// };

export const deleteFile = (imageUrl: string) => {
  const baseUrl = config.backend_image_url;
  const relativePath = imageUrl.replace(baseUrl as string, ""); // Remove base URL
  const afterRelativePath = relativePath.split("/").slice(1).join("/"); // Ensure correct relative path

  const absolutePath = path.join(process.cwd(), "uploads", afterRelativePath); // Use full relative path
  console.log({ absolutePath });
  if (fs.existsSync(absolutePath)) {
    fs.stat(absolutePath, (err, stats) => {
      if (err) {
        console.error("Error retrieving file stats:", err);
        return;
      }

      if (stats.isFile()) {
        fs.unlink(absolutePath, (err) => {
          if (err) {
            console.error("Error while deleting file:", err);
          } else {
            console.log("File deleted successfully:", absolutePath);
          }
        });
      } else {
        console.warn("Error: Path is a directory, not a file:", absolutePath);
      }
    });
  } else {
    console.warn("File does not exist at path:", absolutePath);
  }
};

import fs from "fs";
import path from "path";
import config from "../config";

export const deleteFile = (imageUrl: string) => {
  const baseUrl = config.backend_image_url;
  const relativePath = imageUrl.replace(baseUrl as string, "");
  const afterRelativePath = relativePath.split("/").slice(1).join("/");
  const fileName = path.basename(afterRelativePath);
  const absolutePath = path.join(process.cwd(), "uploads", fileName);

  if (fs.existsSync(absolutePath)) {
    fs.unlink(absolutePath, (err) => {
      if (err) {
        console.error("Error while deleting file:", err);
      } else {
        console.log("File deleted successfully:", absolutePath);
      }
    });
  } else {
    console.warn("File does not exist at path:", absolutePath);
  }
};

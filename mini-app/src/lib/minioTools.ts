import axios from "axios";
import FormData from "form-data";
import { logger } from "@/server/utils/logger";
export const uploadJsonToMinio = async (jsonData: Record<string, any>, bucketName: string, subfolder: string = "") => {
    const buffer = Buffer.from(JSON.stringify(jsonData));
    const fullFilename = `${subfolder}/metadata.json`;
    // Create form data for the upload
    const formData = new FormData();
    formData.append("json", buffer, {
      filename: fullFilename,
      contentType: "application/json",
    });
  
    // Append the bucket name to the form data
    formData.append("bucketName", bucketName);
  
    // Send the JSON data to the upload service (MinIO)
    const url = `http://${process.env.IP_NFT_MANAGER!}:${process.env.NFT_MANAGER_PORT!}/files/upload-json`;
    
    try {
      const res = await axios.post(url, formData, {
        headers: formData.getHeaders(),
      });
  
      if (!res.data || !res.data.jsonUrl) {
        throw new Error("JSON upload failed");
      }
  
      return res.data.jsonUrl;
    } catch (error) {
      logger.error("Error during JSON upload:", error);
      throw new Error("An error occurred during JSON upload");
    }
  };
  
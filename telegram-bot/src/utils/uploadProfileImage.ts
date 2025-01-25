import { API_BASE_URL, JWT_SECRET } from "src/constants";
import FormData from "form-data";
import * as jwt from "jsonwebtoken";
import axios from "axios";

/**
 * Uploads the given buffer to your external file service in subfolder "profiles".
 * Returns the final image URL.
 */
export async function uploadProfileImage(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  // 1. Build the endpoint
  const uploadEndpoint = `${API_BASE_URL}/api/files/upload`;

  // 2. Determine extension (default 'jpg' if none)
  const extension = mimeType.split("/")[1] || "jpg";
  const filename = `profile_image.${extension}`;

  // 3. Create the form data
  const formData = new FormData();
  formData.append("image", buffer, {
    filename,
    contentType: mimeType,
  });
  // We store in subfolder = "profiles"
  formData.append("subfolder", "profiles");

  // 4. Generate a JWT for your upload service
  const token = jwt.sign({ scope: "uploadImage" }, JWT_SECRET, {
    expiresIn: "1h",
  });

  // 5. Make the upload request
  try {
    const response = await axios.post(uploadEndpoint, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    // Check if the response includes an imageUrl
    if (!response.data || !response.data.imageUrl) {
      throw new Error("Upload failed: no imageUrl in response.");
    }

    // Return the final link to the uploaded image
    return response.data.imageUrl;
  } catch (err) {
    console.error("Error during image upload:", err);
    throw new Error("An error occurred during image upload");
  }
}


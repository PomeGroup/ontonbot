import { z } from "zod";
import { zfd } from "zod-form-data";

export const uploadFileSchema = z.object({
  image: zfd
    .file()
    .refine((file) => file.size < 5_000_000, {
      message: "File size must be less than 5MB",
    })
    .refine((file) => file.type.startsWith("image/"), {
      message: "Only JPEG files are allowed",
    })
    .refine(
      (file) => {
        // aspect ratio of 1:1
        const image = new Image();
        image.src = URL.createObjectURL(file);
        return image.width === image.height;
      },
      {
        message: "Only square images are allowed",
      }
    ),
});

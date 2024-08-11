import axios from "axios";
import sizeOf from "image-size";
import { z } from "zod";
import { adminOrganizerProtectedProcedure, router } from "../trpc";
export const fieldsRouter = router({
  uploadImage: adminOrganizerProtectedProcedure
    .input(
      z.object({
        image: z
          .string()
          .refine(
            async (file) => {
              const url = file.replace(/^data:image\/\w+;base64,/, "");
              // @ts-expect-error
              const image = sizeOf(Buffer.from(url, "base64"));

              return image.width === image.height;
            },
            {
              message: "Only square images are allowed",
            }
          )
          .transform((data) => {
            const fileBlob = convertDataUrlToBlob(data);

            return new File([fileBlob], "event_image", {
              type: data.split(";")[0].split(":")[1],
            });
          }),
      })
    )
    .mutation(async (opts) => {
      // convert base64 image to formdata
      const formData = new FormData();
      formData.append(
        "image",
        opts.input.image,
        `event_image.${opts.input.image.type.split("/")[1]}`
      );
      const res = await axios.post(
        "http://nft-manager:7863/files/upload",
        formData
      );

      return res.data as { imageUrl: string };
    }),
});

function convertDataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr?.[0]?.match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

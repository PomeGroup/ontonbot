import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useUploadImage = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axios.post("/api/upload", {
        body: formData,
      });
      return response;
    },
  });
};

import { z } from "zod";

export const generalStepDataSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Title must be at least 2 characters" })
    .max(40, { message: "Title must be less than 40 characters" }),
  subtitle: z
    .string()
    .min(2, { message: "Subtitle must be at least 2 characters" })
    .max(100),
  description: z
    .string({ required_error: "Please enter a description" })
    .min(1, { message: "Description must be at least 1 character" }),
  image_url: z
    .string({ required_error: "Please select an image" })
    .url({ message: "Please select a valid image" }),
  hub: z
    .string({ required_error: "Please select a hub" })
    .min(1, { message: "Please select a hub" }),
});

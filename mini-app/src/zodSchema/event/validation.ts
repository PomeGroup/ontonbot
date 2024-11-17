import { z } from "zod";

export const generalStepDataSchema = z.object({
  title: z
    .string({ required_error: "Please enter a title" })
    .min(10, { message: "Title must be at least 10 characters" }),
  subtitle: z
    .string({ required_error: "Please enter a subtitle" })
    .min(10, { message: "Subtitle must be at least 10 characters" }),
  description: z
    .string({ required_error: "Please enter a description" })
    .min(20, { message: "Description must be at least 20 character" }),
  image_url: z
    .string({ required_error: "Please select an image" })
    .url({ message: "Please select a valid image" }),
  hub: z
    .string({ required_error: "Please select a hub" })
    .min(1, { message: "Please select a hub" }),
});

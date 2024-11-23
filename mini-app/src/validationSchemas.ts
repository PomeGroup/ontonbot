import { z } from "zod";

export const textInputSchema = z.object({
  value: z.string().min(1, "Text is required"),
});

export const numberInputSchema = z.object({
  value: z.string().refine((val) => !isNaN(parseFloat(val)), "Must be a number"),
});

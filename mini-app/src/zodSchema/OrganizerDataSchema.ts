import { z } from "zod";

export const orgFieldsSchema = z.object({
  org_channel_name: z.string().min(3).optional(),
  org_support_telegram_user_name: z.string().optional(),
  org_x_link: z.string().optional(),
  org_bio: z.string().optional(),
  org_image: z.string().optional(),
});

export const searchOrganizersInput = z.object({
  searchString: z.string().optional(),
  cursor: z.number().nullish(), // treat as offset
  limit: z.number().default(10),
});


export const organizersHostedInput = z.object({
  organizerId: z.number().min(3) ,
  cursor: z.number().nullish(), // treat as offset
  limit: z.number().default(10),
});
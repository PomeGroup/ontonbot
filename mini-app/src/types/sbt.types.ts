import { z } from "zod";

export const attributeZod = z.object({ trait_type: z.string(), value: z.string() })
export const attributesArrayZod = z.array(attributeZod)

export type AttributeType = z.infer<typeof attributeZod>

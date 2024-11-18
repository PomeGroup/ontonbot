import { z } from 'zod'


export const MetadataParserZ = z.object({
  name: z.string(),
  image: z.string().url(),
  attributes: z.any(),
  description: z.string()
}).required({
  name: true,
  image: true,
})


export type MetadataType = z.infer<typeof MetadataParserZ>

export type RevokeItemsBody = {
  start_index: number
  end_index: number
}

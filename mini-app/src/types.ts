import { Address } from "@ton/core";
import { z } from "zod";

export type InputField = {
  type: string;
  title: string;
  description: string;
  placeholder: string;
  emoji: string;
};

export type ButtonField = {
  type: string;
  title: string;
  description: string;
  url: string;
  emoji: string;
};

export type FieldElement = InputField | ButtonField;

export interface HubsResponse {
  status: string;
  data: HubType[];
}

export interface HubType {
  id: number;
  attributes: Attributes;
}

export type SocietyHub = {
  id: string;
  name: string;
};

export interface Attributes {
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export type TRequiredEventFields = {
  type: number;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  image_url: string;
  secret_phrase: string;
  society_hub: {
    id: string;
    name: string;
  };
  start_date: number | null;
  end_date: number | null;
  timezone: string;
};

type BaseDynamicField = {
  title: string;
  description: string;
  type: string;
  emoji: string;
};
const isEmoji = (text: string) => {
  const emojiRegex = /\p{Emoji}/u;
  return emojiRegex.test(text);
};

export const InputDynamicFieldSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.string(),
  emoji: z.string().min(1).refine(isEmoji, {
    message: "Must be a valid emoji",
  }),
  placeholder: z.string(),
});

export type InputDynamicField = BaseDynamicField & {
  type: "input";
  placeholder: string;
};

export const ButtonDynamicFieldSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.string(),
  emoji: z.string().min(1).refine(isEmoji, {
    message: "Must be a valid emoji",
  }),
  url: z.string().url(),
});

export type ButtonDynamicField = BaseDynamicField & {
  type: "button";
  url: string;
};

type DynamicField = InputDynamicField | ButtonDynamicField;

export type CreateEventData = TRequiredEventFields & {
  dynamic_fields: DynamicField[];
};

export type ZodErrors = {
  [key: string]: string;
};

export const DynamicFieldsSchema = z.array(
  z.object({
    id: z.number().optional(),
    title: z.string(),
    description: z.string(),
    type: z.string(),
    emoji: z.string(),
    placeholder: z.string().optional(),
    url: z.string().optional(),
  })
);

/* -------------------------------------------------------------------------- */
/*                          💲💲Paid Event Schema💲💲                         */
/* -------------------------------------------------------------------------- */
const PaidEventSchema = z
  .object({
    has_payment: z.boolean().optional().default(false),

    payment_recipient_address: z.string().optional().default(""),
    payment_type: z.enum(["USDT", "TON"]).optional(),
    payment_amount: z.number().optional(),

    has_nft: z.boolean().optional().default(false),
    nft_image_url: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.has_payment) {
      // Validate that `payment_recipient_address` is not empty
      if (!data.payment_recipient_address)
        ctx.addIssue({ code: "custom", path: ["payment_recipient_address"], message: "Recipient address is Required" });
      else if (!Address.isAddress(data.payment_recipient_address))
        ctx.addIssue({ code: "custom", path: ["invalid_payment_recipient_address"], message: "Recipient address is Invalid!" });

      // Validate that `payment_type` is present
      if (!data.payment_type) ctx.addIssue({ code: "custom", path: ["payment_type"], message: "Payment type is required." });

      // Validate that `payment_amount` is present and greater than 0
      if (data.payment_amount === undefined || data.payment_amount <= 0)
        ctx.addIssue({ code: "custom", path: ["payment_amount"], message: "Payment amount must be greater than 0" });

      // Validate that `nft_image_url` is present
      if (data.has_nft && !data.nft_image_url) ctx.addIssue({ code: "custom", path: ["nft_image_url"], message: "Nft image url is required" });
    }
  });

//Create Event
export const EventDataSchema = z.object({
  event_id: z.number().optional(),
  event_uuid: z.string().optional(),
  type: z.number({ required_error: "type is required" }),
  title: z.string({ required_error: "title is required" }),
  subtitle: z.string({ required_error: "subtitle is required" }),
  description: z.string({ required_error: "description is required" }),
  location: z.string({ required_error: "location is required" }),
  image_url: z.string({ required_error: "event image is required" }).url({ message: "Please upload a valid event image URL" }),
  video_url: z.string().url({ message: "Please select a valid reward video URL" }).optional(),
  ts_reward_url: z.string().url({
    message: "Please select a valid reward image URL",
  }), // This allows the field to be undefined
  society_hub: z.object({
    id: z.string({ required_error: "society_hub.id is required" }),
    name: z.string({ required_error: "society_hub.name is required" }),
  }),
  secret_phrase: z.string({ required_error: "secret_phrase is required" }),
  start_date: z.number({ required_error: "start_date is required" }),
  end_date: z.number().nullable(),
  owner: z.number({ required_error: "owner is required" }),
  activity_id: z.number().optional(),
  timezone: z.string({ required_error: "timezone is required" }),
  dynamic_fields: DynamicFieldsSchema, // Assuming DynamicFieldsSchema is defined elsewhere
  eventLocationType: z.enum(["online", "in_person"]).optional(),
  countryId: z.number().optional(),
  cityId: z.number().optional(),

  /* -------------------------- // Free Event Registration Creation ------------------------- */
  has_registration: z.boolean(),
  has_approval: z.boolean(),
  capacity: z.number().min(1).nullable(),
  has_waiting_list: z.boolean(),
  /* -------------------------- // Free Event Registration Creation ------------------------- */

  /* ------------------------------- Paid Event Creation ------------------------------- */
  paid_event: PaidEventSchema.optional(),
  /* ------------------------------- Paid Event Creation ------------------------------- */
});

export const UpdateEventDataSchema = z.object({
  event_id: z.number().optional(),
  event_uuid: z.string().optional(),
  type: z.number({ required_error: "type is required" }),
  title: z.string({ required_error: "title is required" }),
  subtitle: z.string({ required_error: "subtitle is required" }),
  description: z.string({ required_error: "description is required" }),
  location: z.string({ required_error: "location is required" }),
  image_url: z.string({ required_error: "event image is required" }).url({ message: "Please upload a valid image URL" }),
  video_url: z.string().url({ message: "Please upload a valid video URL" }).optional(),
  ts_reward_url: z
    .string()
    .url({
      message: "Please upload a valid reward image URL",
    })
    .optional(), // This allows the field to be undefined
  society_hub: z.object({
    id: z.string({ required_error: "society_hub.id is required" }),
    name: z.string({ required_error: "society_hub.name is required" }),
  }),
  secret_phrase: z.string().optional(),
  start_date: z.number({ required_error: "start_date is required" }),
  end_date: z.number().nullable(),
  owner: z.number({ required_error: "owner is required" }),
  activity_id: z.number().optional(),
  timezone: z.string({ required_error: "timezone is required" }),
  dynamic_fields: DynamicFieldsSchema, // Assuming DynamicFieldsSchema is defined elsewhere
  eventLocationType: z.enum(["online", "in_person"]).optional(),
  countryId: z.number().optional(),
  cityId: z.number().optional(),

  /* -------------------------- // Free Event Registration Update ------------------------- */
  has_approval: z.boolean(),
  capacity: z.number().min(1).nullable(),
  has_waiting_list: z.boolean(),
  /* -------------------------- // Free Event Registration Update ------------------------- */
  /* ------------------------------- Paid Event Update ------------------------------- */
  paid_event: PaidEventSchema.optional(),
  /* ------------------------------- Paid Event Update ------------------------------- */
});

export const EventRegisterSchema = z.object({
  event_uuid: z.string().uuid(),
  full_name: z.string().min(1).max(40),
  company: z.string().min(1).max(40),
  position: z.string().min(1).max(40),
  // optional
  linkedin: z.string().max(100).optional(),
  github: z.string().max(100).optional(),
  notes: z.string().max(512).optional(),
});

export const AgendaItemSchema = z.object({
  time: z.string(), // assuming time is a string, e.g., "10:00 AM"
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const AgendaHeaderSchema = z.object({
  header: z.string().min(1, "Header is required"),
  items: z.array(AgendaItemSchema), // each header can have multiple items
});
export const EventDataSchemaAllOptional = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  ts_reward_url: z.string().url().optional(),
  type: z.number().optional(),
  society_hub: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  secret_phrase: z.string().optional(),
  start_date: z.number().optional(),
  end_date: z.number().nullable().optional(),
  owner: z.number().optional(),
  activity_id: z.number().optional(),
  timezone: z.string().optional(),
  dynamic_fields: DynamicFieldsSchema.optional(),
  eventLocationType: z.enum(["online", "in_person"]).optional(),
  countryId: z.number().optional(),
  cityId: z.number().optional(),
  agenda: z.array(AgendaHeaderSchema).optional(),
  // -----------------
  // free event registration
  has_registration: z.boolean().optional(),
  has_approval: z.boolean().optional(),
  has_waiting_list: z.boolean().optional(),
  capacity: z.number().min(1).nullable().optional(),
});

export type EventData = z.infer<typeof EventDataSchema>;

export const RequiredEventFieldsSchema = z
  .object({
    title: z.string().min(1, { message: "Required" }),
    subtitle: z.string().min(1, { message: "Required" }),
    description: z.string().min(1, { message: "Required" }),
    location: z.string().min(1, { message: "Required" }),
    image_url: z
      .string()
      .url()
      .refine((url) => url.includes("telegra.ph"), {
        message: "URL must be from the 'telegra.ph' domain",
      }),
    secret_phrase: z
      .string()
      .transform((phrase) => phrase.trim().toLowerCase())
      .refine((phrase) => phrase.length >= 4 && phrase.length <= 20, "Length must be between 4 and 20"),
    start_date: z
      .number()
      .min(new Date("2023-01-01").getTime() / 1000)
      .max(new Date("2033-12-31").getTime() / 1000),
    end_date: z
      .number()
      .min(new Date("2023-01-01").getTime() / 1000)
      .max(new Date("2033-12-31").getTime() / 1000)
      .nullable()
      .optional(),
    timezone: z.string(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.start_date <= data.end_date;
      }
      return true;
    },
    {
      message: "Start date must be before end date",
      path: ["start_date", "end_date"],
    }
  );

export type TRequiredEventFieldsSchema = z.infer<typeof RequiredEventFieldsSchema>;

// user_id: opts.input.user.id,
// username: opts.input.user.username,
// first_name: opts.input.user.first_name,
// last_name: opts.input.user.last_name,
// language_code: opts.input.user.language_code,

// make zod schema for user

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  language_code: z.string(),
  role: z.string(),
  wallet_address: z.string().optional(),
});

export type TelegramInitDataJson = {
  query_id: string;
  user: TelegramUser;
  auth_date: string;
  hash: string;
  [key: string]: string | TelegramUser | undefined;
};

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  language_code: string;
  is_premium: boolean;
  allows_write_to_pm: boolean;
};

export type ValueOf<T> = T[keyof T];

import { z } from "zod";

//
// addCouponsSchema
//
const addCouponsSchema = z
  .object({
    event_uuid: z
      .string({
        required_error: "Event UUID is required.",
        invalid_type_error: "Event UUID must be a string.",
      })
      .min(1, "Event UUID cannot be empty."),
    value: z
      .number({
        required_error: "Coupon value is required.",
        invalid_type_error: "Coupon value must be a number.",
      })
      .min(0, "Coupon value cannot be negative."),
    start_date: z.coerce
      .date({
        invalid_type_error: "Start date must be a valid date or parseable string.",
      })
      .refine((date) => !Number.isNaN(date.getTime()), "Start date is invalid or could not be parsed into a Date."),
    end_date: z.coerce
      .date({
        invalid_type_error: "End date must be a valid date or parseable string.",
      })
      .refine((date) => !Number.isNaN(date.getTime()), "End date is invalid or could not be parsed into a Date."),
    count: z
      .number({
        required_error: "count is required.",
        invalid_type_error: "count must be a valid integer.",
      })
      .min(1, "At least 1 coupon item is required."),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be on or after Start date.",
    path: ["end_date"],
  });

//
// editCouponDatesSchema
//
const editCouponDatesSchema = z
  .object({
    id: z
      .number({
        required_error: "Coupon definition ID is required.",
        invalid_type_error: "Coupon definition ID must be a number.",
      })
      .positive("Coupon definition ID must be a positive number."),
    event_uuid: z
      .string({
        required_error: "Event UUID is required.",
        invalid_type_error: "Event UUID must be a string.",
      })
      .min(1, "Event UUID cannot be empty."),
    start_date: z.coerce
      .date({
        invalid_type_error: "Start date must be a valid date or parseable string.",
      })
      .refine((date) => !Number.isNaN(date.getTime()), "Start date is invalid or could not be parsed into a Date."),
    end_date: z.coerce
      .date({
        invalid_type_error: "End date must be a valid date or parseable string.",
      })
      .refine((date) => !Number.isNaN(date.getTime()), "End date is invalid or could not be parsed into a Date."),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be on or after Start date.",
    path: ["end_date"],
  });

//
// updateCouponDefinitionStatusSchema
//
const updateCouponDefinitionStatusSchema = z.object({
  id: z
    .number({
      required_error: "Coupon definition ID is required.",
      invalid_type_error: "Coupon definition ID must be a number.",
    })
    .positive("Coupon definition ID must be a positive number."),
  event_uuid: z
    .string({
      required_error: "Event UUID is required.",
      invalid_type_error: "Event UUID must be a string.",
    })
    .min(1, "Event UUID cannot be empty."),
  status: z.enum(["active", "inactive", "expired"], {
    invalid_type_error: "Status must be one of 'active', 'inactive', or 'expired'.",
    required_error: "Status is required.",
  }),
});

//
// getDefinitionsSchema
//
const getDefinitionsSchema = z.object({
  event_uuid: z
    .string({
      required_error: "Event UUID is required.",
      invalid_type_error: "Event UUID must be a string.",
    })
    .min(1, "Event UUID cannot be empty."),
});

//
// getItemsSchema
//
const getItemsSchema = z.object({
  coupon_definition_id: z
    .number({
      required_error: "Coupon definition ID is required.",
      invalid_type_error: "Coupon definition ID must be a number.",
    })
    .positive("Coupon definition ID must be a positive number."),
});

//
// Combine them into couponSchema
//
const couponSchema = {
  addCouponsSchema,
  editCouponDatesSchema,
  updateCouponDefinitionStatusSchema,
  getDefinitionsSchema,
  getItemsSchema,
};

export default couponSchema;

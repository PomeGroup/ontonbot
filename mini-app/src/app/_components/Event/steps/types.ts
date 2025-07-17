export type GeneralFormErrors = {
  title?: string[];
  subtitle?: string[];
  description?: string[];
  image_url?: string[];
  video_url?: string[];
  society_hub?: string[];

  // registration
  has_registration?: string[];
  has_approval?: string[];
  capacity?: string[];
  category_id?: string[];

  // Date and Time
  start_date?: string[];
  end_date?: string[];
  timezone?: string[];
  duration?: string[];

  // Location
  location?: string[];
  cityId?: string[];
  countryId?: string[];
};

export type AttendanceFormErrors = {
  secret_phrase?: string[];
  ts_reward_url?: string[];
  video_url?: string[];

  // Paid Info Errors
  has_payment?: string[] | undefined;
  payment_recipient_address?: string[] | undefined;
  payment_type?: string[] | undefined;
  ticket_type?: string[] | undefined;
};

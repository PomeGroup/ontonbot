export type GeneralFormErrors = {
  title?: string[];
  subtitle?: string[];
  description?: string[];
  image_url?: string[];
  hub?: string[];
};

export type TimePlaceFormErorrs = {
  start_date?: string[];
  end_date?: string[];
  timezone?: string[];
  location?: string[];
  duration?: string[];
  cityId?: string[];
  countryId?: string[];
};

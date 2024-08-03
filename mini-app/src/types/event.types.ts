export type TonSocietyRegisterActivityT = {
  title: string;
  subtitle: string;
  additional_info?: string;
  description: string;
  hub_id: number;
  start_date: string;
  end_date: string;
  cta_button?: {
    label: string;
    link: string;
  };
};

export type TonSocietyRegisterActivityResponse = {
  status: "success" | "failed";
  data: {
    activity_id: number;
    activity_url: string;
  };
};

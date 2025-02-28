export const is_local_env = () => process.env.ENV?.toLocaleLowerCase() === "local";

export const is_dev_env = () => process.env.ENV?.toLocaleLowerCase() === "development";

export const is_stage_env = () => process.env.ENV?.toLocaleLowerCase() === "staging";

export const is_prod_env = () => process.env.ENV?.toLocaleLowerCase() === "production";

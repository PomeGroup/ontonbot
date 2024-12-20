export function is_dev_env(){
    return process.env.ENV === "development";
}
// export function is_stage_env(){
//     return process.env.ENV === "staging";
// }
export function is_prod_env(){
    return process.env.ENV === "production";
}

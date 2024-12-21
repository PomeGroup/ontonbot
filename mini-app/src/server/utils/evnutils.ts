export function is_dev_env(){
    return process.env.ENV?.toLocaleLowerCase() === "development";
}
// export function is_stage_env(){
//     return process.env.ENV?.toLocaleLowerCase() === "staging";
// }
export function is_prod_env(){
    return process.env.ENV?.toLocaleLowerCase() === "production";
}

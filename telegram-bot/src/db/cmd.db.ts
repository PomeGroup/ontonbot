import { pool } from "./db";

export async function hideCmd(event_uuid : string , hide : boolean) {

  const client = await pool.connect();
    const result = await client.query(
        "UPDATE events SET hidden = $1 WHERE event_uuid = $2 ",
        [hide, event_uuid],
      );

    
}
export async function bannerCmd(event_uuid : string , env : string) {

  const client = await pool.connect();
    const result = await client.query(
        "UPDATE onton_setting SET value = $1 WHERE env = $2 and var = 'homeSliderEventUUID' ",
        [event_uuid , env],
      );

    
}
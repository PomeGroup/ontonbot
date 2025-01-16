import { getClient } from "./db";

export async function hideCmd(event_uuid : string , hide : boolean) {

    const client = await getClient();
    const result = await client.query(
        "UPDATE events SET hidden = $1 WHERE event_uuid = $2 ",
        [hide, event_uuid],
      );

    
}
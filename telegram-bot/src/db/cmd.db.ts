import { pool } from "./db";

export async function hideCmd(event_uuid: string, hide: boolean) {
	const client = await pool.connect();
	const result = await client.query(
		"UPDATE events SET hidden = $1 WHERE event_uuid = $2 ",
		[hide, event_uuid]
	);
}
export async function setBanner(
	env: string,
	position: string,
	event_uuid: string
) {
	const client = await pool.connect();
	try {
		// Map positions to the array index
		const positionMap: Record<string, number> = {
			u1: 0,
			u2: 1,
			d1: 0,
			d2: 1,
			d3: 2,
		};

		// Determine which var to fetch from DB
		const varName = position.toLowerCase().startsWith("u")
			? "homeSliderEventUUID"
			: "homeListEventUUID";

		// Fetch existing array (value) from DB
		const { rows } = await client.query(
			"SELECT value FROM onton_setting WHERE env = $1 AND var = $2 LIMIT 1",
			[env, varName]
		);

		if (!rows.length) {
			throw new Error("No existing setting found.");
		}

		// Replace the correct array element
		const currentValue = rows[0].value; // e.g. ["b1845c...", "abea5d..."]
		const index = positionMap[position.toLowerCase()];
		currentValue[index] = event_uuid;

		// Update DB
		await client.query(
			"UPDATE onton_setting SET value = $1 WHERE env = $2 AND var = $3",
			[currentValue, env, varName]
		);
	} finally {
		client.release();
	}
}

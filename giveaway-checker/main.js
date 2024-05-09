// dependencies
const { Pool } = require("pg");
const cron = require("node-cron");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const TONAPI_BEARER = "Bearer " + process.env.TONAPI_API_KEY;

const TON_API_AUTH_HEADER = {
  Authorization: TONAPI_BEARER,
};

async function checkPastDueEvents() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const query = `
      SELECT * FROM events 
      WHERE type = 1 AND end_date < $1 AND end_date > 0;
    `;

    const res = await pool.query(query, [now]);
    const events = res.rows;

    console.log(`${events.length} past due events found.`);

    for (let event of events) {
      await distribute(event.event_uuid);
    }
  } catch (err) {
    console.error("Error checking for past due events:", err.stack);
  }
}

async function distribute(eventUuid, amount = 0) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const eventQuery = `
        SELECT wallet_seed_phrase, wallet_address, event_id, secret_phrase
        FROM events
        WHERE event_uuid = $1
      `;
    const eventResult = await client.query(eventQuery, [eventUuid]);
    const event = eventResult.rows[0];
    if (!event) throw new Error("Event not found.");
    if (!event.wallet_seed_phrase)
      throw new Error("Event does not have a wallet seed phrase.");

    let eligibleUsersQuery = `
        SELECT DISTINCT u.user_id, u.wallet_address
        FROM users u
        JOIN visitors v ON u.user_id = v.user_id
        WHERE v.event_uuid = $1 AND u.wallet_address IS NOT NULL
        AND NOT EXISTS (
          SELECT ef.id FROM event_fields ef WHERE ef.event_id = $2
          EXCEPT
          SELECT uef.event_field_id FROM user_event_fields uef WHERE uef.user_id = u.user_id AND uef.completed = TRUE
        )
      `;

    const queryParams = [eventUuid, event.event_id];

    const secretPhrase = event.secret_phrase || null;

    if (secretPhrase !== null) {
      eligibleUsersQuery += `
        AND EXISTS (
            SELECT 1
            FROM user_event_fields uef
            JOIN event_fields ef ON uef.event_field_id = ef.id
            WHERE ef.event_id = $2
            AND ef.title = 'Secret Phrase'
            AND uef.data = $3
            AND uef.user_id = u.user_id
        )
      `;
      queryParams.push(secretPhrase);
    }

    // Ensure the parameter array matches the number of placeholders
    const eligibleUsersResult = await client.query(
      eligibleUsersQuery,
      queryParams
    );

    const eligibleUsers = eligibleUsersResult.rows;

    if (eligibleUsers.length === 0) {
      console.log("No eligible users for distribution.");
      await client.query("ROLLBACK");
      return;
    }

    const balance = await fetchBalance(event.wallet_address);
    console.log({ balance });
    const perUser =
      Number.parseFloat(amount) || balance / eligibleUsers.length - 0.02;

    if (perUser < 0.1) {
      console.log("Too small amount: ", perUser, balance);
      return;
    }

    const receivers = {};
    eligibleUsers.forEach((user) => {
      receivers[user.wallet_address] = perUser.toFixed(2);
    });

    await distributionRequest(event.wallet_seed_phrase, { receivers });

    const updateEventQuery = `
        UPDATE events SET type = 2 WHERE event_uuid = $1
      `;
    await client.query(updateEventQuery, [eventUuid]);

    await client.query("COMMIT");
    console.log("Distribution complete and event marked as type 2.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in distribute function:", error.message);
  } finally {
    client.release();
  }
}

async function fetchBalance(address) {
  const url = `https://tonapi.io/v2/accounts/${address}`;

  try {
    const response = await fetch(url, { headers: TON_API_AUTH_HEADER });
    if (!response.ok) {
      console.error(response.ok);
      return 0;
    }

    const jsonResponse = await response.json();
    const balance = jsonResponse.balance;
    if (!balance) {
      console.error("no balance: ", balance);
      return 0;
    }

    return balance / 1e9;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

const distributionRequest = async (seedPhrase, receivers) => {
  try {
    const response = await axios.post(
      "http://golang-server:9999/send",
      { receivers: receivers.receivers },
      {
        headers: {
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb29tX2hhc2giOiJiZWFyZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsImV4cCI6MTYx",
          "Content-Type": "application/json",
        },
        params: {
          seed_phrase: seedPhrase,
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error sending highload wallet transactions:", error);
    throw error;
  }
};

// cron.schedule('*/10 * * * *', checkPastDueEvents);
cron.schedule("*/15 * * * *", checkPastDueEvents);

console.log("Scheduled task to check for past due events every 10 minutes.");

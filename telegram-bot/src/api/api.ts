import axios from "axios";


const BEARER = "Bearer b413D1dd233224t3SD21Pf6UFEJ34jwowevlowqekKPVPKVWE133242552P948okmreboerbeobrmbermbw";
const AUTH_HEADER = { Authorization: BEARER };

export async function fetchWebsiteData(hash: string) {
    if (hash === "b09b30dbef8f52b796ded292c240b661bdf68d7cff9337db7a15230af0fa48d3") {
        return {
            "name": "Global Chat",
            "description": "It's the first game on TON that's fully deployed on-chain."
        }
    }


    try {
        const response = await axios.get(
            `https://api.tonsites.io/api/website/${hash}`,
            { headers: AUTH_HEADER }
        );
        return response.data;
    } catch (err) {
        console.error("Error fetching website data:", err);
        return null;
    }
}
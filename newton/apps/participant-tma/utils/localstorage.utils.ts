export function getLatestUTMCampaign() {
  // Get all keys from localStorage
  const keys = Object.keys(localStorage);

  // Filter keys to find those that match the UTM campaign pattern
  const utmKeys = keys.filter((key) => key.startsWith("utm_campaign--"));

  if (utmKeys.length === 0) {
    // If no UTM campaigns are found, return null
    return null;
  }

  // Sort the keys by their timestamp in descending order
  utmKeys.sort((a, b) => {
    const timeA = Number(a.split("--")[1]);
    const timeB = Number(b.split("--")[1]);
    return timeB - timeA; // Latest first
  });

  // Return the value of the latest UTM campaign
  return localStorage.getItem(utmKeys[0]!);
}

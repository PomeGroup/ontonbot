/**
 * Minimal interface for the click data we enqueue in Redis.
 * Enough info to find affiliate link + insert a row in `affiliate_click`.
 */
export interface EnqueuedClick {
  linkHash: string; // references affiliate_links.link_hash
  userId: number; // references user table, or 0 if unknown
  createdAt?: number; // optional timestamp in ms
}

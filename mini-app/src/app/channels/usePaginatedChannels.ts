import { trpc } from "../_trpc/client";

const limit = 20

export default function usePaginatedChannels(q = '') {
  return trpc.users.searchOrganizers.useInfiniteQuery({
    searchString: q,
    limit,
  }, {
    getNextPageParam(lastPage) {
      const lastPageItems = lastPage.items
      if (lastPageItems.length < 10) return undefined; // No more pages if results are less than limit
      return lastPageItems[lastPageItems.length - 1].user_id; // Calculate offset for next page
    },
  })
}

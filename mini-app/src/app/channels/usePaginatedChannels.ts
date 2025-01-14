import { trpc } from "../_trpc/client";

const limit = 20

export default function usePaginatedChannels(q = '') {
  return trpc.organizers.searchOrganizers.useInfiniteQuery({
    searchString: q,
    limit,
  }, {
    getNextPageParam(lastPage) {
      return lastPage.nextCursor
    },
  })
}

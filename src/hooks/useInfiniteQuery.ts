import { useInfiniteQuery as useTanstackInfiniteQuery, type UseInfiniteQueryOptions } from '@tanstack/react-query';

/**
 * Wrapper personnalisé pour le hook useInfiniteQuery de TanStack Query.
 */
export function useInfiniteQuery<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData>
) {
  return useTanstackInfiniteQuery(options);
}

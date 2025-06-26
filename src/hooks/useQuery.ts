import { useQuery as useTanstackQuery, type UseQueryOptions } from '@tanstack/react-query';

/**
 * Wrapper personnalisé pour le hook useQuery de TanStack Query.
 */
export function useQuery<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(
  options: UseQueryOptions<TQueryFnData, TError, TData>
) {
  return useTanstackQuery(options);
}

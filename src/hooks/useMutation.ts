import { useMutation as useTanstackMutation, type UseMutationOptions } from '@tanstack/react-query';

/**
 * Wrapper personnalisé pour le hook useMutation de TanStack Query.
 */
export function useMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  return useTanstackMutation(options);
}

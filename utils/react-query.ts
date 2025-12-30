import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is considered fresh for 1 minute
            staleTime: 60 * 1000,
            // Retry failed requests 1 time
            retry: 1,
            // Refetch on window focus for consistent UI
            refetchOnWindowFocus: true,
        },
    },
})

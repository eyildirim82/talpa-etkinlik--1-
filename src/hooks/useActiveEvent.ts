import { useQuery } from '@tanstack/react-query';
import { getActiveEvent } from '../api/events';

export const useActiveEvent = () => {
    return useQuery({
        queryKey: ['activeEvent'],
        queryFn: getActiveEvent,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
    });
};

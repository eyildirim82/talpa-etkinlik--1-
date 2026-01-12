// Event Module Public API

// Public API (User-facing)
export * from './api/event.api'

// Admin API
export {
    getAllEventsAdmin,
    createEventAdmin,
    updateEventAdmin,
    deleteEventAdmin,
    setActiveEventAdmin,
    getEventStatsAdmin,
    type AdminEvent
} from './api/event.admin.api'

// Services
export { uploadEventBanner, deleteEventBanner, type UploadResult } from './services/event-storage.service'

// Hooks
export * from './hooks/useActiveEvent'
export {
    useAdminEvents,
    useCreateEvent,
    useUpdateEvent,
    useDeleteEvent,
    useSetActiveEvent,
    EVENT_ADMIN_QUERY_KEY
} from './hooks/useEventAdmin'

// Components
export * from './components/EventCard'

// Types
export * from './types/event.types'


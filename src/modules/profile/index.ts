// Profile Module Public API

// Public API (User-facing)
export * from './api/profile.api'

// Admin API
export {
    getAllUsersAdmin,
    updateUserRoleAdmin,
    getUserByIdAdmin,
    searchUsersAdmin,
    type AdminUser,
    type ProfileAdminResponse
} from './api/profile.admin.api'

// Services
export {
    parseExcelMembers,
    validateMemberData,
    importMembers,
    type MemberImportData,
    type MemberImportResult,
    type BatchImportResult
} from './services/member-import.service'

// User Hooks
export * from './hooks/useProfile'

// Admin Hooks
export {
    useAdminUsers,
    useAdminUser,
    useSearchUsersAdmin,
    useUpdateUserRole,
    PROFILE_ADMIN_QUERY_KEY
} from './hooks/useProfileAdmin'

// Types
export * from './types/profile.types'


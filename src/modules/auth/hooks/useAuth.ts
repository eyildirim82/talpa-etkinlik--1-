import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, signup, logout } from '../api/auth.api'
import type { LoginCredentials, SignupData } from '../types/auth.types'

/**
 * Hook for authentication operations
 */
export function useAuth() {
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: () => {
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })

  const signupMutation = useMutation({
    mutationFn: (data: SignupData) => signup(data),
  })

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear()
    },
  })

  return {
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    isLoading: loginMutation.isPending || signupMutation.isPending || logoutMutation.isPending,
    error: loginMutation.error || signupMutation.error || logoutMutation.error,
  }
}


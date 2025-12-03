/**
 * React Query hook for user profile management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { changePassword, getUserProfile, updateUserProfile } from "../lib/api";
import type {
  ChangePasswordRequest,
  MessageResponse,
  UserProfile,
  UserUpdateRequest,
} from "../types/api";

/**
 * Fetch current user profile
 * @returns User profile data with React Query state
 */
export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ["user", "profile"],
    queryFn: getUserProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Update current user profile
 * @returns Mutation for updating user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UserUpdateRequest>({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      // Update cached profile data
      queryClient.setQueryData(["user", "profile"], data);
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

/**
 * Change user password
 * @returns Mutation for changing password
 */
export function useChangePassword() {
  return useMutation<MessageResponse, Error, ChangePasswordRequest>({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast.success(
        data.message || "Password changed successfully. Please login again.",
      );
      // Note: Backend revokes all sessions, user will be redirected to login
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change password");
    },
  });
}

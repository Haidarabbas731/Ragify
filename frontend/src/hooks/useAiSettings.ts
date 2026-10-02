/**
 * React Query hooks for the user's AI model settings (provider, model, API key)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAiSettings,
  getApiErrorMessage,
  listAiModels,
  resetAiSettings,
  saveAiSettings,
  testAiSettings,
} from "../lib/api";
import type {
  AiModel,
  AiProvider,
  AiSettings,
  AiSettingsUpdate,
  AiTestResult,
} from "../types/api";

const SETTINGS_KEY = ["ai", "settings"];

/**
 * Fetch the user's AI settings and the server defaults
 * @returns Settings with React Query state
 */
export function useAiSettings() {
  return useQuery<AiSettings>({
    queryKey: SETTINGS_KEY,
    queryFn: getAiSettings,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Save the user's provider, model and API key
 * @returns Mutation that updates the cached settings on success
 */
export function useSaveAiSettings() {
  const queryClient = useQueryClient();

  return useMutation<AiSettings, unknown, AiSettingsUpdate>({
    mutationFn: saveAiSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_KEY, data);
      toast.success("AI settings saved");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to save AI settings"));
    },
  });
}

/**
 * Remove the saved key and model
 * @returns Mutation that refreshes the settings on success
 */
export function useResetAiSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetAiSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
      toast.success("Your key was removed. Chat now uses the default model.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to remove your key"));
    },
  });
}

/**
 * Test a provider, model and key. The result is shown inline by the caller.
 * @returns Mutation resolving to whether the connection worked
 */
export function useTestAiSettings() {
  return useMutation<AiTestResult, unknown, AiSettingsUpdate>({
    mutationFn: testAiSettings,
  });
}

/**
 * List models for a provider (only providers with a catalog return any)
 * @param provider - Provider to list models for
 * @returns Models with React Query state
 */
export function useAiModels(provider: AiProvider) {
  return useQuery<AiModel[]>({
    queryKey: ["ai", "models", provider],
    queryFn: () => listAiModels(provider),
    enabled: provider === "openrouter",
    staleTime: 1000 * 60 * 60,
  });
}

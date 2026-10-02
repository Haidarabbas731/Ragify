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
import { useDebouncedValue } from "./useDebouncedValue";

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
 * Short non-reversible fingerprint (FNV-1a). Lets a query refetch when the typed key changes
 * without putting the key itself into the cache key.
 */
function fingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

/**
 * List models for a provider.
 *
 * OpenRouter's list is public. Gemini's needs a key: the one being typed (once the user
 * pauses), else the saved or server key, which the backend picks. With no key it is empty.
 * @param provider - Provider to list models for
 * @param apiKey - Key the user is typing, if any
 * @returns Models with React Query state
 */
export function useAiModels(provider: AiProvider, apiKey: string) {
  const typedKey = useDebouncedValue(apiKey.trim(), 600);
  const keyForRequest =
    provider === "gemini" && typedKey.length >= 8 ? typedKey : undefined;

  return useQuery<AiModel[]>({
    queryKey: [
      "ai",
      "models",
      provider,
      keyForRequest ? fingerprint(keyForRequest) : "saved",
    ],
    queryFn: () => listAiModels(provider, keyForRequest),
    staleTime: 1000 * 60 * 60,
    // A rejected key will not fix itself; show the message instead of retrying
    retry: false,
  });
}

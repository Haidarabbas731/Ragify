import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/errors";
import {
  useAiModels,
  useAiSettings,
  useResetAiSettings,
  useSaveAiSettings,
  useTestAiSettings,
} from "../../hooks/useAiSettings";
import type { AiProvider } from "../../types/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ModelPicker } from "./ModelPicker";

const PROVIDERS: Record<
  AiProvider,
  { label: string; keyUrl: string; modelPlaceholder: string }
> = {
  gemini: {
    label: "Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    modelPlaceholder: "e.g. gemini-2.5-flash",
  },
  openrouter: {
    label: "OpenRouter",
    keyUrl: "https://openrouter.ai/keys",
    modelPlaceholder: "e.g. openai/gpt-4o-mini",
  },
};

/**
 * Lets a user choose the chat model provider and model and save their own API key.
 *
 * The key is sent once and stored encrypted; afterwards only its last 4 characters are
 * shown. Chat needs a saved key; the server has none of its own.
 */
export function AiModelSettings() {
  const { data: settings, isLoading, error } = useAiSettings();
  const save = useSaveAiSettings();
  const reset = useResetAiSettings();
  const test = useTestAiSettings();

  const [provider, setProvider] = useState<AiProvider>("gemini");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const modelsQuery = useAiModels(provider, apiKey);

  // Fill the form from the saved settings (or the server defaults) once they load
  useEffect(() => {
    if (!settings) return;
    setProvider(settings.provider ?? settings.default_provider);
    setModel(settings.model ?? settings.default_model);
  }, [settings]);

  // Forget a stale test result when the inputs change
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only on input changes
  useEffect(() => {
    test.reset();
  }, [provider, model, apiKey]);

  // Cancel the "click again to remove" confirmation after a few seconds
  useEffect(() => {
    if (!confirmRemove) return;
    const timer = setTimeout(() => setConfirmRemove(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmRemove]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading AI settings…
      </div>
    );
  }

  if (error || !settings) {
    return (
      <p className="py-3 text-sm text-destructive">
        {getApiErrorMessage(error, "Couldn't load your AI settings.")}
      </p>
    );
  }

  const hasKeyForProvider = settings.has_key && settings.provider === provider;
  const typedKey = apiKey.trim();
  const keyOk = typedKey.length >= 8 || (typedKey === "" && hasKeyForProvider);
  const modelOk = model.trim() !== "";
  const changed =
    typedKey !== "" ||
    !settings.has_key ||
    settings.provider !== provider ||
    settings.model !== model.trim();
  const body = {
    provider,
    model: model.trim(),
    ...(typedKey ? { api_key: typedKey } : {}),
  };

  const handleSave = () => {
    save.mutate(body, { onSuccess: () => setApiKey("") });
  };

  const handleRemove = () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    setConfirmRemove(false);
    reset.mutate(undefined, { onSuccess: () => setApiKey("") });
  };

  const active = settings.has_key
    ? `Using your ${PROVIDERS[settings.provider as AiProvider].label} key ending ${settings.key_last4} · ${settings.model}`
    : "No API key is set. Add one below to use chat.";

  const modelCount = modelsQuery.data?.length ?? 0;
  const modelsStatus = modelsQuery.isLoading
    ? "Loading models…"
    : modelsQuery.isError
      ? getApiErrorMessage(
          modelsQuery.error,
          "Couldn't load the model list. You can still type a model name.",
        )
      : modelCount === 0
        ? provider === "gemini"
          ? "Paste your API key to see available models, or type a model name."
          : "Enter a model id."
        : `${modelCount} ${
            provider === "openrouter"
              ? "models with tool calling"
              : "Gemini chat models"
          }. Type to search, or enter any id.`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">AI model</h2>
        <p className="text-sm text-muted-foreground">{active}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          Provider
        </legend>
        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
          {settings.providers.map((name) => (
            <label
              key={name}
              className="cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out has-[:checked]:bg-card has-[:checked]:text-foreground has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name="ai-provider"
                value={name}
                checked={provider === name}
                onChange={() => {
                  setProvider(name);
                  // A model id from one provider is meaningless for the other
                  setModel(
                    name === settings.provider ? (settings.model ?? "") : "",
                  );
                }}
                className="sr-only"
              />
              {PROVIDERS[name].label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="ai-model">Model</Label>
        <ModelPicker
          id="ai-model"
          value={model}
          onChange={setModel}
          models={modelsQuery.data}
          statusText={modelsStatus}
          statusIsError={modelsQuery.isError}
          placeholder={PROVIDERS[provider].modelPlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai-key">API key</Label>
        <div className="relative">
          <Input
            id="ai-key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              hasKeyForProvider
                ? `Saved key ending ${settings.key_last4}. Leave empty to keep it.`
                : "Paste your API key"
            }
            autoComplete="off"
            spellCheck={false}
            className="pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? "Hide API key" : "Show API key"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Get a key from{" "}
          <a
            href={PROVIDERS[provider].keyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {PROVIDERS[provider].label}
          </a>
          . It's stored encrypted and never shown again. Your questions and the
          document excerpts they use are sent to this provider.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={!modelOk || !keyOk || test.isPending}
          onClick={() => test.mutate(body)}
        >
          {test.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Test connection
        </Button>
        <Button
          type="button"
          disabled={!modelOk || !keyOk || !changed || save.isPending}
          onClick={handleSave}
        >
          {save.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Save
        </Button>
        {settings.has_key && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={reset.isPending}
            className="text-sm text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
          >
            {confirmRemove ? "Click again to remove" : "Remove my key"}
          </button>
        )}
      </div>

      <output aria-live="polite" className="block min-h-5">
        {(test.data || test.isError) && (
          <span
            key={test.data?.message ?? "error"}
            className={`step-in inline-flex items-start gap-2 text-sm ${
              test.data?.ok ? "text-success" : "text-destructive"
            }`}
          >
            {test.data?.ok ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {test.data?.message ??
              getApiErrorMessage(test.error, "Couldn't run the test.")}
          </span>
        )}
      </output>
    </div>
  );
}

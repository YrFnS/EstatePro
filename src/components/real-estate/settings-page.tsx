"use client";

import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useOpenRouterSettings } from "@/lib/openrouter-settings";
import { SUGGESTED_MODELS, DEFAULT_MODEL } from "@/lib/openrouter";
import { motion } from "framer-motion";
import {
  Settings, Key, Cpu, CheckCircle2, XCircle, Eye, EyeOff,
  ExternalLink, Loader2, Trash2, Shield, Info, Sparkles,
  Wand2, Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function SettingsPage() {
  const { t } = useI18n();
  const { settings, updateSettings, clearSettings } = useOpenRouterSettings();

  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey);
  const [modelInput, setModelInput] = useState(settings.model);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleApiKeyChange = (value: string) => {
    setApiKeyInput(value);
    setHasChanges(true);
  };

  const handleModelChange = (value: string) => {
    setModelInput(value.trim());
    setHasChanges(true);
  };

  const handleSuggestionClick = (modelId: string) => {
    setModelInput(modelId);
    setHasChanges(true);
    setShowSuggestions(false);
  };

  const handleSave = () => {
    updateSettings({
      apiKey: apiKeyInput,
      model: modelInput || DEFAULT_MODEL,
    });
    setHasChanges(false);
    setTestResult(null);
  };

  const handleClear = () => {
    clearSettings();
    setApiKeyInput("");
    setModelInput(DEFAULT_MODEL);
    setHasChanges(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!apiKeyInput) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKeyInput}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://estatepro.app",
          "X-Title": "EstatePro",
        },
        body: JSON.stringify({
          model: modelInput || DEFAULT_MODEL,
          messages: [
            { role: "user", content: "Say 'Connection successful!' in exactly those words." },
          ],
          temperature: 0,
          max_tokens: 20,
        }),
      });

      if (response.ok) {
        setTestResult("success");
      } else {
        setTestResult("error");
      }
    } catch {
      setTestResult("error");
    } finally {
      setIsTesting(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    const input = modelInput.toLowerCase();
    if (!input) return SUGGESTED_MODELS;
    return SUGGESTED_MODELS.filter(
      (m) =>
        m.id.toLowerCase().includes(input) ||
        m.name.toLowerCase().includes(input) ||
        m.provider.toLowerCase().includes(input)
    );
  }, [modelInput]);

  // Find matching suggestion name for display
  const matchedSuggestion = SUGGESTED_MODELS.find((m) => m.id === modelInput);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">{t("settings.title")}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("settings.title")}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t("settings.description")}</p>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
      </motion.div>

      {/* Status Banner */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
          settings.isConfigured
            ? "bg-primary/5 border-primary/20"
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
        }`}>
          {settings.isConfigured ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-primary">{t("settings.configured")}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {t("settings.apiKeyMasked")}: {maskApiKey(settings.apiKey)} &bull; {t("settings.currentModel")}: {SUGGESTED_MODELS.find(m => m.id === settings.model)?.name || settings.model}
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300">{t("settings.notConfigured")}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">{t("settings.configurePrompt")}</p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* OpenRouter Configuration Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              {t("settings.openrouterKey")}
            </CardTitle>
            <CardDescription>
              OpenRouter provides unified access to hundreds of AI models from any provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-sm font-medium">
                {t("settings.openrouterKey")}
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder={t("settings.openrouterKeyPlaceholder")}
                  className="pe-20"
                />
                <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? "Hide" : "Show"}
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                {t("settings.getModel")}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Model Input - Text field with suggestions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="model" className="text-sm font-medium">
                  {t("settings.selectModel")}
                </Label>
                <a
                  href="https://openrouter.ai/models"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Browse all models
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <div className="relative">
                  <Cpu className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="model"
                    type="text"
                    value={modelInput}
                    onChange={(e) => handleModelChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="e.g. google/gemini-2.0-flash-001"
                    className="ps-9"
                  />
                </div>

                {/* Suggestion dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-1.5">
                      <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
                        <Wand2 className="w-3 h-3" />
                        <span>Popular models — click to select, or type any model ID</span>
                      </div>
                      {filteredSuggestions.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-start text-sm transition-colors hover:bg-accent ${
                            modelInput === model.id ? "bg-accent/50" : ""
                          }`}
                          onClick={() => handleSuggestionClick(model.id)}
                        >
                          <Cpu className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{model.name}</span>
                            <span className="text-muted-foreground text-xs ms-1.5 truncate">{model.id}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0 px-1.5 py-0">
                            {model.provider}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Model info display */}
              {modelInput && (
                <div className="flex items-center gap-2 mt-1">
                  {matchedSuggestion ? (
                    <>
                      <Badge variant="outline" className="text-xs gap-1">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        {matchedSuggestion.provider}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {matchedSuggestion.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Wand2 className="w-3 h-3 text-amber-500" />
                        Custom model
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-help truncate max-w-[200px]">
                              {modelInput}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Full model ID: {modelInput}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              )}

              {/* Quick suggestion chips when input is empty */}
              {!modelInput && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_MODELS.slice(0, 6).map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-background hover:bg-accent transition-colors"
                        onClick={() => handleSuggestionClick(model.id)}
                      >
                        <Cpu className="w-3 h-3 text-muted-foreground" />
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Test Connection */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={!apiKeyInput || !modelInput || isTesting}
                className="gap-2"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {t("settings.testConnection")}
              </Button>
              {testResult === "success" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-primary text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t("settings.testSuccess")}
                </motion.div>
              )}
              {testResult === "error" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  {t("settings.testFailed")}
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || !apiKeyInput || !modelInput}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg gap-2"
              >
                <Settings className="w-4 h-4" />
                {t("settings.saveSettings")}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
                {t("settings.clearSettings")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage Info Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="w-4 h-4 text-primary" />
              {t("settings.usageInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("settings.usageInfoDesc")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">AI Property Match</p>
                  <p className="text-xs text-muted-foreground">Personalized recommendations</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50">
                <Key className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Property Valuation</p>
                  <p className="text-xs text-muted-foreground">AI-powered estimates</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50">
                <Cpu className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">AI Chat</p>
                  <p className="text-xs text-muted-foreground">Real estate assistant</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{t("settings.pricingInfo")}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Your API key is stored locally in your browser and never sent to our servers.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <Wand2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Custom Models</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  You can enter any OpenRouter-compatible model ID. When new models are released, just type the new model ID — no app update needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useApiKeys } from '@/hooks/use-api-keys';
import { freeModels, modelCategories } from '@/lib/ai';
import {
  AlertCircle,
  Bot,
  CheckCircle,
  Cpu,
  Eye,
  EyeOff,
  Globe,
  Key,
  Loader2,
  Save,
  Search,
  Server,
  Sparkles,
  Trash2,
} from 'lucide-react';

const providerInfo = [
  { key: 'google', label: 'Google AI', icon: Sparkles, color: 'text-blue-500', placeholder: 'AIza...' },
  { key: 'openai', label: 'OpenAI', icon: Bot, color: 'text-green-500', placeholder: 'sk-...' },
  { key: 'openrouter', label: 'OpenRouter', icon: Globe, color: 'text-purple-500', placeholder: 'sk-or-...' },
  { key: 'groq', label: 'Groq', icon: Cpu, color: 'text-orange-500', placeholder: 'gsk_' },
  { key: 'mistral', label: 'Mistral', icon: Server, color: 'text-slate-500', placeholder: 'Mistral API key' },
  { key: 'tavily', label: 'Tavily Search', icon: Search, color: 'text-cyan-500', placeholder: 'tvly-...' },
];

const modelSections = [
  { title: 'Free / Developer Tier', models: freeModels },
  { title: 'Gemini Free Tier', models: modelCategories.geminiFree },
  { title: 'Groq Developer Plan', models: modelCategories.groqDeveloper },
  { title: 'Mistral Developer Plan', models: modelCategories.mistralDeveloper },
  { title: 'OpenRouter Free', models: modelCategories.openrouterFree },
  { title: 'Fast Models', models: modelCategories.fast },
  { title: 'Balanced Models', models: modelCategories.balanced },
  { title: 'Powerful Models', models: modelCategories.powerful },
];

export default function SettingsPage() {
  const { apiKeys, loading, updateKey, saveKeys, clearKeys } = useApiKeys();
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savedMessage, setSavedMessage] = useState('');

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveKeys();
      setSavedMessage('Settings saved successfully.');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all API keys?')) {
      await clearKeys();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your AI providers and API keys</p>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          {savedMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Key className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">API Keys</h2>
            <p className="text-sm text-gray-500">Your keys are saved to your account or this browser</p>
          </div>
        </div>

        <div className="space-y-4">
          {providerInfo.map((provider) => (
            <div key={provider.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-2">
                  <provider.icon className={`w-4 h-4 ${provider.color}`} />
                  {provider.label}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showKeys[provider.key] ? 'text' : 'password'}
                  value={apiKeys[provider.key as keyof typeof apiKeys] || ''}
                  onChange={(event) => updateKey(provider.key as keyof typeof apiKeys, event.target.value)}
                  placeholder={provider.placeholder}
                  className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(provider.key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys[provider.key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {provider.key === 'tavily' ? 'Required for web search.' : 'Optional if the same key is already in .env.local.'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Default Model</h2>
            <p className="text-sm text-gray-500">Choose your preferred AI model</p>
          </div>
        </div>

        <div className="space-y-4">
          {modelSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{section.title}</h3>
              <div className="flex flex-wrap gap-2">
                {section.models.map((model) => (
                  <button
                    key={model}
                    onClick={() => updateKey('defaultModel', model)}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      apiKeys.defaultModel === model
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Keys
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Security Note</p>
          <p>Use provider keys only for accounts you control. Free and developer-tier availability can change by provider.</p>
        </div>
      </div>
    </div>
  );
}

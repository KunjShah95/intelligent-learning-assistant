'use client';

import { useState } from 'react';
import { freeModels, modelCategories, type ModelProvider } from '@/lib/ai';
import { Bot, ChevronDown, Check, Loader2 } from 'lucide-react';

interface ModelSelectorProps {
  currentModel?: string;
  onModelChange?: (model: ModelProvider) => void;
}

const modelGroups = [
  { name: 'Free / Developer Tier', models: freeModels },
  { name: 'Gemini Free Tier', models: modelCategories.geminiFree },
  { name: 'Groq Developer Plan', models: modelCategories.groqDeveloper },
  { name: 'Mistral Developer Plan', models: modelCategories.mistralDeveloper },
  { name: 'OpenRouter Free', models: modelCategories.openrouterFree },
  { name: 'Fast', models: modelCategories.fast },
  { name: 'Balanced', models: modelCategories.balanced },
  { name: 'Powerful', models: modelCategories.powerful },
];

export function ModelSelector({ currentModel = 'gemini-1.5-flash', onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  const activeModel = currentModel as ModelProvider;

  const handleSelect = async (model: ModelProvider) => {
    setTesting(true);
    onModelChange?.(model);
    await new Promise(r => setTimeout(r, 500));
    setTesting(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={testing}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
      >
        {testing ? (
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
        ) : (
          <Bot className="w-4 h-4 text-orange-500" />
        )}
        <span className="text-sm font-medium text-gray-700">{activeModel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
          {modelGroups.map((group) => (
            <div key={group.name} className="py-1">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                {group.name}
              </div>
              {group.models.map((model) => (
                <button
                  key={model}
                  onClick={() => handleSelect(model)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition ${
                    activeModel === model
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{model}</span>
                  {activeModel === model && (
                    <Check className="w-4 h-4 text-orange-500" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ModelSelectorMobile({ currentModel = 'gemini-1.5-flash', onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeModel = currentModel as ModelProvider;

  const handleSelect = async (model: ModelProvider) => {
    onModelChange?.(model);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg"
      >
        <Bot className="w-4 h-4 text-orange-500" />
        <span className="text-sm">{activeModel}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Select Model</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400">✕</button>
            </div>
            
            {modelGroups.map((group) => (
              <div key={group.name} className="mb-4">
                <div className="text-xs font-medium text-gray-400 uppercase mb-2">{group.name}</div>
                <div className="space-y-1">
                  {group.models.slice(0, 6).map((model) => (
                    <button
                      key={model}
                      onClick={() => handleSelect(model)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition ${
                        activeModel === model
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
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
      )}
    </>
  );
}

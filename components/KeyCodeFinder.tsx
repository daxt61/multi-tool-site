import { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, Copy, Check, Trash2, Code, History, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface KeyEventInfo {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  timestamp: number;
}

export function KeyCodeFinder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [currentEvent, setCurrentEvent] = useState<KeyEventInfo | null>(initialData?.currentEvent || null);
  const [history, setHistory] = useState<KeyEventInfo[]>(initialData?.history || []);
  const [activeTab, setActiveTab] = useState<'info' | 'snippets' | 'history'>(initialData?.activeTab || 'info');
  const [snippetLang, setSnippetLang] = useState<'js' | 'react' | 'python' | 'go'>('js');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ currentEvent, history, activeTab });
  }, [currentEvent, history, activeTab, onStateChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default behaviour if standard test shortcut or modifier is pressed
    // unless the target is an input/textarea.
    const isEditable =
      document.activeElement?.tagName === "INPUT" ||
      document.activeElement?.tagName === "TEXTAREA" ||
      document.activeElement?.tagName === "SELECT" ||
      document.activeElement?.getAttribute('contenteditable') === 'true';

    // Allow normal typing if focused on form elements
    if (isEditable) return;

    // Handle global shortcuts first
    if (e.key === 'Escape') {
      e.preventDefault();
      setCurrentEvent(null);
      setHistory([]);
      toast.success(t('keycode.cleared') || 'Cleared history');
      return;
    }

    if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      if (currentEvent) {
        e.preventDefault();
        navigator.clipboard.writeText(JSON.stringify(currentEvent, null, 2));
        toast.success(t('keycode.copied_all') || 'Copied key event JSON');
        return;
      }
    }

    e.preventDefault();

    const info: KeyEventInfo = {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      which: e.which,
      location: e.location,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      timestamp: Date.now(),
    };

    setCurrentEvent(info);
    setHistory(prev => [info, ...prev].slice(0, 50)); // Clamp history to max 50 entries
  }, [currentEvent, t]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const copyValue = (value: string | number, label: string) => {
    navigator.clipboard.writeText(String(value));
    setCopiedField(label);
    toast.success(`${label}: ${t('common.copied') || 'Copied'}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getCodeSnippet = (): string => {
    if (!currentEvent) return '';
    const { key, code, ctrlKey, shiftKey, altKey, metaKey } = currentEvent;

    let modifiersStr = '';
    const modifiersList = [];
    if (ctrlKey) modifiersList.push('ctrlKey');
    if (shiftKey) modifiersList.push('shiftKey');
    if (altKey) modifiersList.push('altKey');
    if (metaKey) modifiersList.push('metaKey');

    switch (snippetLang) {
      case 'js':
        modifiersStr = modifiersList.map(mod => `e.${mod}`).join(' && ');
        return `document.addEventListener('keydown', (event) => {
  if (event.key === '${key}'${modifiersStr ? ` && ${modifiersStr}` : ''}) {
    console.log('Key pressed: ${key}');
    event.preventDefault();
  }
});`;
      case 'react':
        modifiersStr = modifiersList.map(mod => `e.${mod}`).join(' && ');
        return `const handleKeyDown = (event) => {
  if (event.key === '${key}'${modifiersStr ? ` && ${modifiersStr}` : ''}) {
    console.log('React Key detected: ${key}');
  }
};

// Bind to element: <div onKeyDown={handleKeyDown} tabIndex={0} />`;
      case 'python':
        return `import keyboard

def on_key_event(event):
    if event.name == '${key.toLowerCase()}':
        print("Key pressed: ${key}")

keyboard.on_press(on_key_event)
# Keep program running
keyboard.wait()`;
      case 'go':
        return `// Using robotgo library
package main

import (
    "fmt"
    "github.com/go-vgo/robotgo"
)

func main() {
    ok := robotgo.AddEvents("${key.toLowerCase()}")
    if ok {
        fmt.Println("Key pressed: ${key}")
    }
}`;
      default:
        return '';
    }
  };

  const getLocationLabel = (loc: number): string => {
    switch (loc) {
      case 0: return 'Standard (0)';
      case 1: return 'Left / Gauche (1)';
      case 2: return 'Right / Droite (2)';
      case 3: return 'Numpad / Pavé numérique (3)';
      default: return `Unknown / Inconnu (${loc})`;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Dynamic Key Code Splash Screen / Jumbotron */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-4 left-4 flex gap-2">
          <Kbd modifier={null}>Esc</Kbd>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('keycode.reset_tip') || 'Reset'}</span>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Kbd modifier={null}>C</Kbd>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('keycode.copy_tip') || 'Copy JSON'}</span>
        </div>

        {currentEvent ? (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500">
              {t('keycode.detected') || 'Detected Key'}
            </p>
            <div className="text-7xl md:text-9xl font-black text-slate-900 dark:text-white font-mono tracking-tight select-none">
              {currentEvent.keyCode}
            </div>
            <div className="flex justify-center gap-2 items-center">
              <span className="text-sm font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                event.key = "{currentEvent.key === ' ' ? 'Space' : currentEvent.key}"
              </span>
              <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-1.5 rounded-full">
                event.code = "{currentEvent.code}"
              </span>
            </div>
          </div>
        ) : (
          <div className="py-12 space-y-4">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Keyboard className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {t('keycode.press_prompt') || 'Press any key on your keyboard'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {t('keycode.press_prompt_sub') || 'We will extract standard JS event properties, code snippets, and history logs instantly.'}
            </p>
          </div>
        )}
      </div>

      {currentEvent && (
        <div className="space-y-6">
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'info'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('keycode.tab_properties') || 'Properties'}
            </button>
            <button
              onClick={() => setActiveTab('snippets')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'snippets'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('keycode.tab_snippets') || 'Code Snippets'}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('keycode.tab_history') || 'History'} ({history.length})
            </button>
          </div>

          {/* Properties Grid */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('keycode.standard_props') || 'Standard Keyboard Event Properties'}
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex justify-between py-3">
                    <span className="text-sm font-medium text-slate-500 font-mono">event.key</span>
                    <button
                      onClick={() => copyValue(currentEvent.key, 'event.key')}
                      className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                    >
                      {currentEvent.key === ' ' ? 'Space' : currentEvent.key}
                      {copiedField === 'event.key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-sm font-medium text-slate-500 font-mono">event.code</span>
                    <button
                      onClick={() => copyValue(currentEvent.code, 'event.code')}
                      className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                    >
                      {currentEvent.code}
                      {copiedField === 'event.code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-sm font-medium text-slate-500 font-mono">event.keyCode</span>
                    <button
                      onClick={() => copyValue(currentEvent.keyCode, 'event.keyCode')}
                      className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                    >
                      {currentEvent.keyCode}
                      {copiedField === 'event.keyCode' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-sm font-medium text-slate-500 font-mono">event.which</span>
                    <button
                      onClick={() => copyValue(currentEvent.which, 'event.which')}
                      className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                    >
                      {currentEvent.which}
                      {copiedField === 'event.which' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-sm font-medium text-slate-500 font-mono">event.location</span>
                    <button
                      onClick={() => copyValue(currentEvent.location, 'event.location')}
                      className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline text-right"
                    >
                      {getLocationLabel(currentEvent.location)}
                      {copiedField === 'event.location' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modifiers Grid */}
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('keycode.modifier_keys') || 'Modifier Keys'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all ${currentEvent.ctrlKey ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    <span className="text-xs font-black tracking-widest uppercase text-slate-400">Control</span>
                    <span className="text-lg font-bold">{currentEvent.ctrlKey ? 'true' : 'false'}</span>
                  </div>
                  <div className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all ${currentEvent.shiftKey ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    <span className="text-xs font-black tracking-widest uppercase text-slate-400">Shift</span>
                    <span className="text-lg font-bold">{currentEvent.shiftKey ? 'true' : 'false'}</span>
                  </div>
                  <div className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all ${currentEvent.altKey ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    <span className="text-xs font-black tracking-widest uppercase text-slate-400">Alt / Option</span>
                    <span className="text-lg font-bold">{currentEvent.altKey ? 'true' : 'false'}</span>
                  </div>
                  <div className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all ${currentEvent.metaKey ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    <span className="text-xs font-black tracking-widest uppercase text-slate-400">Meta / OS / Cmd</span>
                    <span className="text-lg font-bold">{currentEvent.metaKey ? 'true' : 'false'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Code Snippets Section */}
          {activeTab === 'snippets' && (
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setSnippetLang('js')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      snippetLang === 'js' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    JavaScript
                  </button>
                  <button
                    onClick={() => setSnippetLang('react')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      snippetLang === 'react' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    React
                  </button>
                  <button
                    onClick={() => setSnippetLang('python')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      snippetLang === 'python' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setSnippetLang('go')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      snippetLang === 'go' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Go
                  </button>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getCodeSnippet());
                    toast.success(t('keycode.snippet_copied') || 'Snippet copied!');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" /> {t('common.copy') || 'Copy'}
                </button>
              </div>

              <pre className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed text-indigo-600 dark:text-indigo-400">
                {getCodeSnippet()}
              </pre>
            </div>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('keycode.recent_events') || 'Recent Keyboard Events'}
                </h3>
                <button
                  onClick={() => setHistory([])}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t('common.clear') || 'Clear'}
                </button>
              </div>

              {history.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                  {t('keycode.no_history') || 'No keyboard event history yet.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-400">
                        <th className="py-3 px-4">Key</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">KeyCode</th>
                        <th className="py-3 px-4">Modifiers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-mono">
                      {history.map((h, i) => {
                        const mods = [];
                        if (h.ctrlKey) mods.push('Ctrl');
                        if (h.shiftKey) mods.push('Shift');
                        if (h.altKey) mods.push('Alt');
                        if (h.metaKey) mods.push('Cmd');
                        return (
                          <tr key={h.timestamp + '-' + i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {h.key === ' ' ? 'Space' : h.key}
                            </td>
                            <td className="py-3 px-4 text-slate-500">{h.code}</td>
                            <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 font-bold">{h.keyCode}</td>
                            <td className="py-3 px-4 text-slate-500 text-xs">
                              {mods.length > 0 ? mods.join(' + ') : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* About Box */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          {t('keycode.about_title') || 'About Keyboard Event Info'}
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('keycode.about_desc') || 'Standard JavaScript Keyboard Event properties capture information on keys pressed on physical input devices. This offline developer companion allows you to inspect event.keyCode, event.key, and event.code attributes instantaneously while preventing browser default events. Ideal for debugging keyboard accessibility standards, custom shortcuts, and key bindings securely.'}
        </p>
      </div>
    </div>
  );
}

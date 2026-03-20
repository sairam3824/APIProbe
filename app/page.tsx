"use client";

import { useEffect, useState } from "react";
import { getISTTimestamp, maskKey, PROVIDERS, ApiKeyState } from "@/lib/api-checker";
import { validateApiKeyAction } from "@/lib/actions";
import { Plus, CheckCircle2, XCircle, RefreshCw, Key, ShieldCheck, History, ArrowRight, Trash2, Download, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [key, setKey] = useState("");
  const [provider, setProvider] = useState("openai");
  const [history, setHistory] = useState<ApiKeyState[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("api_key_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // Corrupted localStorage — ignore and start fresh
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("api_key_history", JSON.stringify(history));
  }, [history]);

  const handleCheck = async () => {
    const trimmedKey = key.trim();
    if (!trimmedKey) return;
    setIsChecking(true);
    setCheckError(null);

    try {
      const result = await validateApiKeyAction(provider, trimmedKey);
      const newEntry: ApiKeyState = {
        id: Date.now().toString(),
        provider,
        key: trimmedKey,
        maskedKey: maskKey(trimmedKey),
        status: result.status,
        models: result.models,
        lastCheckedAt: getISTTimestamp(),
        errorMessage: result.errorMessage
      };

      setHistory(prev => [newEntry, ...prev]);
      setKey("");
    } catch (err: any) {
      setCheckError(err.message || "Network error — please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && key.trim() && !isChecking) {
      handleCheck();
    }
  };

  const recheck = async (item: ApiKeyState) => {
    setHistory(current => current.map(h => h.id === item.id ? { ...h, status: 'pending' as const } : h));

    try {
      const result = await validateApiKeyAction(item.provider, item.key);
      setHistory(current => current.map(h => h.id === item.id ? {
        ...h,
        status: result.status,
        models: result.models,
        lastCheckedAt: getISTTimestamp(),
        errorMessage: result.errorMessage
      } : h));
    } catch (err: any) {
      setHistory(current => current.map(h => h.id === item.id ? {
        ...h,
        status: 'error' as const,
        errorMessage: err.message || "Network error"
      } : h));
    }
  };

  const deleteItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your local history?")) {
      setHistory([]);
    }
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-keys-history-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyKey = (item: ApiKeyState) => {
    navigator.clipboard.writeText(item.key);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container">
      <div className="glow" />

      <header className="header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          AI Key Guard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Professional validator for your AI API keys
        </motion.p>
      </header>

      <motion.div
        className="card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="input-group">
          <div style={{ flex: '0 0 180px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 500 }}>Provider</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)}>
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="input-container">
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 500 }}>API Key</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="password"
                placeholder="Paste key here... (Enter to submit)"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button onClick={handleCheck} disabled={isChecking || !key.trim()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isChecking ? (
                  <>
                    <div className="loading-spinner" /> Validating...
                  </>
                ) : (
                  <>
                    Run Diagnostic <ArrowRight size={18} />
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {checkError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: '1rem',
                color: '#f87171',
                fontSize: '0.85rem',
                padding: '0.6rem 0.9rem',
                background: 'rgba(244, 63, 94, 0.07)',
                borderRadius: '8px',
                borderLeft: '3px solid #f43f5e'
              }}
            >
              {checkError}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <section className="history">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
            <History size={20} className="text-accent" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Real-time Audit Log</h2>
            {history.length > 0 && (
              <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '999px', padding: '2px 10px', fontWeight: 600 }}>
                {history.length}
              </span>
            )}
          </div>

          {history.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={exportHistory} className="recheck-btn" title="Export to JSON" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                <Download size={14} /> Export
              </button>
              <button onClick={clearHistory} className="recheck-btn" title="Clear History" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#f87171' }}>
                <Trash2 size={14} /> Clear
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence mode="popLayout">
            {history.length === 0 ? (
              <motion.div
                className="card"
                style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ShieldCheck size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p>No keys checked yet. Your history will be stored locally for privacy.</p>
              </motion.div>
            ) : (
              history.map((item) => (
                <motion.div
                  key={item.id}
                  className="history-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1.1rem' }}>
                        {PROVIDERS.find(p => p.id === item.provider)?.name}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.9rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.maskedKey}
                      </span>
                      <span className={`status-badge status-${item.status}`}>
                        {item.status === 'working' ? 'Live & Operational' : item.status === 'invalid' ? 'Invalid Key' : item.status === 'pending' ? 'Verifying...' : 'Service Error'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} />
                        <span>Diagnostics: {item.lastCheckedAt}</span>
                      </div>
                    </div>

                    {item.models.length > 0 && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Available Models</p>
                        <div className="model-list">
                          {item.models.slice(0, 15).map(m => (
                            <span key={m} className="model-tag">{m}</span>
                          ))}
                          {item.models.length > 15 && <span className="model-tag" style={{ border: 'none', background: 'transparent' }}>+{item.models.length - 15} more</span>}
                        </div>
                      </div>
                    )}

                    {item.errorMessage && item.status !== 'working' && (
                      <div style={{
                        color: '#f87171',
                        fontSize: '0.8rem',
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(244, 63, 94, 0.05)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #f43f5e'
                      }}>
                        {item.errorMessage}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      className="recheck-btn"
                      onClick={() => copyKey(item)}
                      title="Copy Key"
                    >
                      {copiedId === item.id ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                    </button>
                    <button
                      className="recheck-btn"
                      onClick={() => recheck(item)}
                      disabled={item.status === 'pending'}
                      title="Re-run Diagnostics"
                    >
                      <RefreshCw size={18} className={item.status === 'pending' ? 'spin' : ''} />
                    </button>
                    <button
                      className="recheck-btn"
                      onClick={() => deleteItem(item.id)}
                      title="Remove from history"
                      style={{ color: '#64748b' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
        <p>© {new Date().getFullYear()} AI Key Guard • Premium Diagnostics Dashboard</p>
        <p style={{ marginTop: '0.5rem' }}>Key history is stored in your browser's local storage for privacy.</p>
      </footer>
    </div>
  );
}
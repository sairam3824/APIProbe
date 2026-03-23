"use client";

import { useState } from "react";
import { maskKey, PROVIDERS } from "@/lib/api-checker";
import { validateApiKeyAction } from "@/lib/actions";
import { ArrowRight, Key, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckResult {
  provider: string;
  maskedKey: string;
  status: 'working' | 'invalid' | 'error';
  models: string[];
  errorMessage?: string;
}

export default function Home() {
  const [key, setKey] = useState("");
  const [provider, setProvider] = useState("openai");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const handleCheck = async () => {
    const trimmedKey = key.trim();
    if (!trimmedKey) return;
    setIsChecking(true);
    setCheckError(null);
    setResult(null);

    try {
      const res = await validateApiKeyAction(provider, trimmedKey);
      setResult({
        provider,
        maskedKey: maskKey(trimmedKey),
        status: res.status,
        models: res.models,
        errorMessage: res.errorMessage,
      });
      setKey("");
    } catch (err: unknown) {
      setCheckError(err instanceof Error ? err.message : "Network error — please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && key.trim() && !isChecking) handleCheck();
  };

  return (
    <div className="container">
      <div className="glow" />

      <header className="header">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          AI Key Guard
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
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
                  <><div className="loading-spinner" /> Validating...</>
                ) : (
                  <>Run Diagnostic <ArrowRight size={18} /></>
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

      <AnimatePresence>
        {result && (
          <motion.div
            className="history-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1.1rem' }}>
                  {PROVIDERS.find(p => p.id === result.provider)?.name}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.9rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                  {result.maskedKey}
                </span>
                <span className={`status-badge status-${result.status}`}>
                  {result.status === 'working' ? 'Live & Operational' : result.status === 'invalid' ? 'Invalid Key' : 'Service Error'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={14} />
                <span>Diagnostic complete</span>
              </div>

              {result.models.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Available Models</p>
                  <div className="model-list">
                    {result.models.slice(0, 15).map(m => (
                      <span key={m} className="model-tag">{m}</span>
                    ))}
                    {result.models.length > 15 && (
                      <span className="model-tag" style={{ border: 'none', background: 'transparent' }}>+{result.models.length - 15} more</span>
                    )}
                  </div>
                </div>
              )}

              {result.errorMessage && result.status !== 'working' && (
                <div style={{
                  color: '#f87171',
                  fontSize: '0.8rem',
                  marginTop: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(244, 63, 94, 0.05)',
                  borderRadius: '8px',
                  borderLeft: '3px solid #f43f5e'
                }}>
                  {result.errorMessage}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
        <p>© {new Date().getFullYear()} AI Key Guard • Premium Diagnostics Dashboard</p>
      </footer>
    </div>
  );
}

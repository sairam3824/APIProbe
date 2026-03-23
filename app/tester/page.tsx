"use client";

import { useState } from "react";
import { PROVIDERS } from "@/lib/api-checker";
import { validateApiKeyAction, testSpecificModelAction } from "@/lib/actions";
import { Key, TestTube, Play, CheckCircle2, XCircle, AlertTriangle, Zap, Search, Activity, Trash2, SquareCheck, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModelStatus {
  id: string;
  status: 'idle' | 'checking' | 'working' | 'failed' | 'error';
  latency?: number;
  errorMessage?: string;
}

export default function TesterPage() {
  const [key, setKey] = useState("");
  const [provider, setProvider] = useState("openai");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [modelStatuses, setModelStatuses] = useState<Record<string, ModelStatus>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchModels = async () => {
    if (!key.trim()) return;
    setIsFetching(true);
    setFetchError(null);
    try {
      const result = await validateApiKeyAction(provider, key.trim());
      if (result.status === 'working') {
        setAvailableModels(result.models);
        setSelectedModels(result.models.slice(0, 5));
        setModelStatuses({});
      } else {
        setFetchError(result.errorMessage || "Failed to fetch models. Check your key.");
        setAvailableModels([]);
        setSelectedModels([]);
      }
    } catch (err: any) {
      setFetchError(err.message || "Network error — please try again.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && key.trim() && !isFetching) {
      fetchModels();
    }
  };

  const toggleModel = (m: string) => {
    setSelectedModels(prev =>
      prev.includes(m) ? prev.filter(i => i !== m) : [...prev, m]
    );
  };

  const selectAll = () => setSelectedModels([...filteredModels]);
  const deselectAll = () => setSelectedModels([]);

  const runTests = async () => {
    if (selectedModels.length === 0) return;
    setIsRunning(true);
    const statuses: Record<string, ModelStatus> = {};
    selectedModels.forEach(m => {
      statuses[m] = { id: m, status: 'checking' };
    });
    setModelStatuses(statuses);

    for (const modelId of selectedModels) {
      const result = await testSpecificModelAction(provider, key.trim(), modelId);
      setModelStatuses(prev => ({
        ...prev,
        [modelId]: {
          id: modelId,
          status: result.status as ModelStatus['status'],
          latency: result.latency,
          errorMessage: result.errorMessage
        }
      }));
    }
    setIsRunning(false);
  };

  const filteredModels = availableModels.filter(m =>
    m.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFilteredSelected = filteredModels.length > 0 && filteredModels.every(m => selectedModels.includes(m));

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="glow" />
      <header className="header">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>Model Stress Tester</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          Diagnostic request sender for individual model verification
        </motion.p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Sidebar: Key & Model Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <motion.div className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: '#f1f5f9', fontWeight: 600 }}>1. Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Provider</label>
                <select value={provider} onChange={(e) => { setProvider(e.target.value); setAvailableModels([]); setSelectedModels([]); setModelStatuses({}); setFetchError(null); }}>
                  {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>API Key</label>
                <input
                  type="password"
                  placeholder="Paste your key... (Enter)"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <AnimatePresence>
                {fetchError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      color: '#f87171',
                      fontSize: '0.8rem',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(244, 63, 94, 0.07)',
                      borderRadius: '8px',
                      borderLeft: '3px solid #f43f5e'
                    }}
                  >
                    {fetchError}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={fetchModels}
                disabled={isFetching || !key.trim()}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {isFetching ? "Listing Models..." : "Get Available Models"}
              </button>
            </div>
          </motion.div>

          {availableModels.length > 0 && (
            <motion.div className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#f1f5f9', fontWeight: 600 }}>2. Select Models</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedModels.length} / {availableModels.length}</span>
              </div>

              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  placeholder="Filter models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '0.6rem 0.6rem 0.6rem 2.2rem', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem' }}>
                <button
                  className="recheck-btn"
                  onClick={allFilteredSelected ? deselectAll : selectAll}
                  style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {allFilteredSelected ? <Square size={13} /> : <SquareCheck size={13} />}
                  {allFilteredSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.5rem' }}>
                {filteredModels.map(m => (
                  <label
                    key={m}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '0.6rem 0.8rem',
                      background: selectedModels.includes(m) ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedModels.includes(m) ? 'var(--accent)' : 'var(--card-border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(m)}
                      onChange={() => toggleModel(m)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ color: selectedModels.includes(m) ? '#fff' : '#94a3b8' }}>{m}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={runTests}
                disabled={selectedModels.length === 0 || isRunning}
                style={{ width: '100%', marginTop: '1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isRunning ? <><div className="loading-spinner" style={{ width: '14px', height: '14px', borderTopColor: '#fff' }} /> Running...</> : <><Play size={16} /> Test Selected ({selectedModels.length})</>}
                </div>
              </button>
            </motion.div>
          )}
        </div>

        {/* Results Panel */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <motion.div
            className="card"
            style={{ flex: 1, minHeight: '600px' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#f1f5f9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={20} className="text-accent" /> Test Results
              </h3>
              {Object.keys(modelStatuses).length > 0 && (
                <button onClick={() => setModelStatuses({})} className="recheck-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                  <Trash2 size={14} /> Clear Results
                </button>
              )}
            </div>

            {Object.keys(modelStatuses).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '10rem 2rem', color: '#64748b' }}>
                <TestTube size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.1 }} />
                <p>Configure your key and select models to start testing.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedModels.map(m => {
                  const status = modelStatuses[m];
                  if (!status) return null;
                  const borderColor = status.status === 'working' ? '#10b981' : status.status === 'failed' ? '#ef4444' : status.status === 'error' ? '#f97316' : '#64748b';
                  const badgeClass = status.status === 'working' ? 'status-working' : status.status === 'failed' ? 'status-failed' : status.status === 'error' ? 'status-error' : 'status-pending';
                  return (
                    <motion.div
                      key={m}
                      className="history-item"
                      style={{ padding: '1rem 1.5rem', borderLeft: `4px solid ${borderColor}` }}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{m}</span>
                          {status.status === 'checking' && <div className="loading-spinner" style={{ width: '12px', height: '12px' }} />}
                        </div>
                        {status.latency !== undefined && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                            <Zap size={12} /> Response in {status.latency}ms
                          </div>
                        )}
                        {status.errorMessage && (
                          <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.4rem', background: 'rgba(244, 63, 94, 0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                            {status.errorMessage}
                          </div>
                        )}
                      </div>
                      <div className={`status-badge ${badgeClass}`}>
                        {status.status.toUpperCase()}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
        <p>© {new Date().getFullYear()} AI Key Guard • Automated Model Stress Tester</p>
      </footer>
    </div>
  );
}

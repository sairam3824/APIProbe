"use client";

import { useEffect, useState } from "react";
import { PROVIDERS, ApiKeyState } from "@/lib/api-checker";
import { History, Filter, Search, ShieldCheck, RefreshCw, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HistoryPage() {
  const [history, setHistory] = useState<ApiKeyState[]>([]);
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("api_key_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // Corrupted localStorage — ignore
    }
  }, []);

  const filteredHistory = history.filter(item => {
    const providerName = PROVIDERS.find(p => p.id === item.provider)?.name || "";
    const matchesProvider = filterProvider === "all" || item.provider === filterProvider;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesSearch = item.maskedKey.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          providerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvider && matchesStatus && matchesSearch;
  });

  const copyKey = (item: ApiKeyState) => {
    navigator.clipboard.writeText(item.key);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container">
      <div className="glow" />
      <header className="header" style={{ marginBottom: '3rem' }}>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Audit History
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Comprehensive logs of all diagnostic checks and validation results
        </motion.p>
        {history.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}
          >
            {filteredHistory.length === history.length
              ? `${history.length} record${history.length !== 1 ? 's' : ''}`
              : `${filteredHistory.length} of ${history.length} records`}
          </motion.p>
        )}
      </header>

      <motion.div 
        className="card" 
        style={{ padding: '1.5rem', marginBottom: '2.5rem' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '280px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.6rem', display: 'block', fontWeight: 500 }}>Search Keys / Provider</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                placeholder="Filter by key fragment or provider name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
              />
            </div>
          </div>
          
          <div style={{ width: '200px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.6rem', display: 'block', fontWeight: 500 }}>Filter Provider</label>
            <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} style={{ fontSize: '0.9rem' }}>
              <option value="all">All Providers</option>
              {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div style={{ width: '200px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.6rem', display: 'block', fontWeight: 500 }}>Filter Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ fontSize: '0.9rem' }}>
              <option value="all">All Status</option>
              <option value="working">Live & Operational</option>
              <option value="invalid">Invalid Key</option>
              <option value="error">Service Error</option>
            </select>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence mode="popLayout">
          {filteredHistory.length === 0 ? (
            <motion.div 
              style={{ textAlign: 'center', padding: '6rem', color: '#64748b' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Filter size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.1 }} />
              <p style={{ fontSize: '1.1rem' }}>No matching history found for current filters.</p>
              <button 
                className="recheck-btn" 
                style={{ marginTop: '1.5rem' }}
                onClick={() => { setFilterProvider("all"); setFilterStatus("all"); setSearchQuery(""); }}
              >
                Reset Filters
              </button>
            </motion.div>
          ) : (
            filteredHistory.map((item, index) => (
              <motion.div 
                key={item.id} 
                className="history-item"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                layout
              >
                 <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1.05rem' }}>
                        {PROVIDERS.find(p => p.id === item.provider)?.name}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                        {item.maskedKey}
                      </span>
                      <span className={`status-badge status-${item.status}`}>
                        {item.status === 'working' ? 'Live' : item.status}
                      </span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} />
                      Diagnostic timestamp: {item.lastCheckedAt}
                    </div>
                    {item.models.length > 0 && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                        Compatible with: {item.models.slice(0, 5).join(", ")}{item.models.length > 5 ? ` +${item.models.length - 5} more` : ""}
                      </div>
                    )}
                 </div>
                 <div style={{ display: 'flex', gap: '8px' }}>
                   <button 
                     className="recheck-btn" 
                     onClick={() => copyKey(item)}
                     title="Copy Key"
                     style={{ padding: '0.75rem' }}
                   >
                      {copiedId === item.id ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                   </button>
                 </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <footer style={{ marginTop: '5rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
        <p>© {new Date().getFullYear()} AI Key Guard • Comprehensive History Dashboard</p>
      </footer>
    </div>
  );
}

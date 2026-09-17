import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Calendar, Clock, MapPin, Theater, Link as LinkIcon, 
  CheckCircle2, AlertCircle, Plus, Trash2, ArrowLeft, Loader2, Info, Star 
} from 'lucide-react';
import { Production, Performance, Language } from '../../types';
import { parseScheduleText, ParsedScheduleResult } from '../../lib/scheduleParser';
import { mergePerformancesIntoProduction } from '../../lib/scheduleUtils';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProductions: Production[];
  onApply: (updatedProductions: Production[]) => void;
  currentLang?: Language;
}

const SAMPLE_TEXT = `Production:
Fliegen die Raben noch? (UA)

Role:
Erster Raben

Location:
Pfalztheater, Kaiserslautern

Performances:
09.10.2026
19:00 – 21:00 Uhr
Werkstattbühne | Kaiserslautern
Ausverkauft

24.10.2026
18:00 Uhr
Werkstattbühne | Kaiserslautern
[Tickets](https://theater-kaiserslautern.de/tickets/241026)

22.11.2026 16:00
Werkstattbühne | Kaiserslautern
[Tickets](https://theater-kaiserslautern.de/tickets/221126)

29.11.2026 18:30 Uhr
Werkstattbühne | Kaiserslautern
[Tickets](https://theater-kaiserslautern.de/tickets/291126)

15.12.2026 11:00
Werkstattbühne | Kaiserslautern

28.01.2027 18:00
Werkstattbühne | Kaiserslautern

05.03.2027 19:30
Theater im Pfalzbau | Ludwigshafen

06.03.2027 19:30
Theater im Pfalzbau | Ludwigshafen

07.03.2027 18:00
Theater im Pfalzbau | Ludwigshafen`;

export default function SmartImportModal({
  isOpen,
  onClose,
  existingProductions,
  onApply,
  currentLang = 'EN'
}: SmartImportModalProps) {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedScheduleResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [editingProduction, setEditingProduction] = useState<Production | null>(null);
  const [mergeMode, setMergeMode] = useState<'merge' | 'new'>('merge');

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!inputText.trim()) {
      setParseError('Please paste schedule text to import.');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const result = await parseScheduleText(inputText);
      setParseResult(result);
      setEditingProduction(result.production);

      // Check for existing matching production
      const match = existingProductions.find(p => 
        p.title.EN.toLowerCase().trim() === result.production.title.EN.toLowerCase().trim() ||
        p.title.DE.toLowerCase().trim() === result.production.title.DE.toLowerCase().trim()
      );
      if (match) {
        setMergeMode('merge');
      } else {
        setMergeMode('new');
      }
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse text. Please check the format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleInsertSample = () => {
    setInputText(SAMPLE_TEXT);
    setParseError(null);
  };

  const matchingProduction = parseResult && editingProduction
    ? existingProductions.find(p => 
        p.title.EN.toLowerCase().trim() === editingProduction.title.EN.toLowerCase().trim() ||
        p.title.DE.toLowerCase().trim() === editingProduction.title.DE.toLowerCase().trim()
      )
    : null;

  const handleAddPerformance = () => {
    if (!editingProduction) return;
    const defaultVenue = editingProduction.location.EN ? editingProduction.location.EN.split(',')[0].trim() : '';
    const defaultCity = editingProduction.location.EN && editingProduction.location.EN.includes(',') 
      ? editingProduction.location.EN.split(',')[1].trim() 
      : '';

    const newPerf: Performance = {
      id: `perf-add-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      startTime: '19:30',
      venue: defaultVenue,
      city: defaultCity,
      ticketUrl: '',
      ticketStatus: 'available',
      isPremiere: editingProduction.performances.length === 0,
      notes: ''
    };
    setEditingProduction({
      ...editingProduction,
      performances: [...editingProduction.performances, newPerf]
    });
  };

  const handleUpdatePerformance = (index: number, updates: Partial<Performance>) => {
    if (!editingProduction) return;
    const updated = [...editingProduction.performances];
    updated[index] = { ...updated[index], ...updates };
    setEditingProduction({
      ...editingProduction,
      performances: updated
    });
  };

  const handleDeletePerformance = (index: number) => {
    if (!editingProduction) return;
    const updated = editingProduction.performances.filter((_, i) => i !== index);
    setEditingProduction({
      ...editingProduction,
      performances: updated
    });
  };

  const handleConfirmApply = () => {
    if (!editingProduction) return;

    if (matchingProduction && mergeMode === 'merge') {
      // Merge into existing production
      const { production: mergedProd } = mergePerformancesIntoProduction(matchingProduction, editingProduction);
      const updatedList = existingProductions.map(p => p.id === matchingProduction.id ? mergedProd : p);
      onApply(updatedList);
    } else {
      // Add as brand new production
      const newProd: Production = {
        ...editingProduction,
        order: existingProductions.length
      };
      onApply([newProd, ...existingProductions]);
    }

    onClose();
  };

  const handleResetReview = () => {
    setParseResult(null);
    setEditingProduction(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="relative bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-200 z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-serif uppercase tracking-widest text-white">Smart Import Schedule</h2>
              <p className="text-[10px] text-neutral-400 font-sans tracking-wide">
                Parse theater raw text into structured productions and performances
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {!editingProduction ? (
            /* STEP 1: Paste Text Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-sans">
                  Paste Schedule / Theatre Text:
                </label>
                <button
                  type="button"
                  onClick={handleInsertSample}
                  className="text-[10px] uppercase tracking-widest text-[#C9A227] hover:underline"
                >
                  Insert Sample Text
                </button>
              </div>

              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Paste raw schedule text here...\n\nExample:\nProduction: Fliegen die Raben noch? (UA)\nRole: Erster Raben\nLocation: Pfalztheater, Kaiserslautern\n\n09.10.2026 19:00 – 21:00 Uhr\nWerkstattbühne | Kaiserslautern\nAusverkauft\n\n24.10.2026 18:00\nWerkstattbühne | Kaiserslautern\n[Tickets](https://...)`}
                className="w-full h-64 bg-neutral-900 border border-neutral-800 focus:border-[#C9A227] rounded-xl p-4 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors resize-none leading-relaxed"
              />

              {parseError && (
                <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-xl space-y-2 text-xs text-neutral-400">
                <div className="flex items-center space-x-2 text-neutral-300 font-medium">
                  <Info className="w-4 h-4 text-[#C9A227]" />
                  <span>Zero External API Keys Required</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Uses on-device Local AI when supported in your browser, backed by a deterministic parsing engine for dates, times, roles, and theatres. All processing occurs locally.
                </p>
              </div>
            </div>
          ) : (
            /* STEP 2: Review & Edit Form */
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Parse Method Badge & Notes */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white font-medium">Schedule Parsed Successfully</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/30">
                    {parseResult?.methodUsed === 'local-ai' ? 'Local AI' : 'Deterministic Parser'}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {editingProduction.performances.length} Performance{editingProduction.performances.length !== 1 ? 's' : ''} detected
                </span>
              </div>

              {/* Match / Duplicate Detection Banner */}
              {matchingProduction && (
                <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <Info className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-white">
                        Matching Production Found: <span className="text-[#C9A227]">"{matchingProduction.title.EN || matchingProduction.title.DE}"</span>
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        This production is already in your schedule with {matchingProduction.performances.length} performance dates.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 pt-1 text-xs">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="mergeChoice" 
                        checked={mergeMode === 'merge'} 
                        onChange={() => setMergeMode('merge')} 
                        className="text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <span>Merge new dates into existing production (Recommended)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="mergeChoice" 
                        checked={mergeMode === 'new'} 
                        onChange={() => setMergeMode('new')} 
                        className="text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <span>Create as separate entry</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Production Details */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="text-xs font-serif uppercase tracking-widest text-[#C9A227]">
                    1. Production Details
                  </h3>
                  <div className="flex items-center space-x-2">
                    <label className="text-[10px] uppercase text-neutral-400">Category:</label>
                    <select
                      value={editingProduction.category}
                      onChange={(e) => setEditingProduction({ ...editingProduction, category: e.target.value as any })}
                      className="bg-neutral-800 border border-neutral-700 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-[#C9A227]"
                    >
                      <option value="Opera">Opera</option>
                      <option value="Concert">Concert</option>
                      <option value="Recital">Recital</option>
                      <option value="Gala">Gala</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Title (EN)</label>
                    <input 
                      type="text"
                      value={editingProduction.title.EN}
                      onChange={(e) => setEditingProduction({
                        ...editingProduction,
                        title: { ...editingProduction.title, EN: e.target.value }
                      })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Title (DE)</label>
                    <input 
                      type="text"
                      value={editingProduction.title.DE}
                      onChange={(e) => setEditingProduction({
                        ...editingProduction,
                        title: { ...editingProduction.title, DE: e.target.value }
                      })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Title (KO)</label>
                    <input 
                      type="text"
                      value={editingProduction.title.KO}
                      onChange={(e) => setEditingProduction({
                        ...editingProduction,
                        title: { ...editingProduction.title, KO: e.target.value }
                      })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Role (EN)</label>
                    <input 
                      type="text"
                      value={editingProduction.role.EN}
                      onChange={(e) => setEditingProduction({
                        ...editingProduction,
                        role: { ...editingProduction.role, EN: e.target.value }
                      })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Role (DE)</label>
                    <input 
                      type="text"
                      value={editingProduction.role.DE}
                      onChange={(e) => setEditingProduction({
                        ...editingProduction,
                        role: { ...editingProduction.role, DE: e.target.value }
                      })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Role (KO)</label>
                    <input 
                      type="text"
                      value={editingProduction.role.KO}
                      onChange={(e) => setEditingProduction({
                        ...editingProduction,
                        role: { ...editingProduction.role, KO: e.target.value }
                      })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Location / Theatre</label>
                    <input 
                      type="text"
                      value={editingProduction.location.EN}
                      onChange={(e) => setEditingProduction({
                        ...editingProduction,
                        location: { ...editingProduction.location, EN: e.target.value, DE: e.target.value, KO: e.target.value }
                      })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Season</label>
                    <input 
                      type="text"
                      value={editingProduction.season || ''}
                      onChange={(e) => setEditingProduction({
                        ...editingProduction,
                        season: e.target.value
                      })}
                      placeholder="e.g. 2026/27"
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2 focus:border-[#C9A227] focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">General Link (URL)</label>
                    <input 
                      type="text"
                      value={editingProduction.generalLink || ''}
                      onChange={(e) => setEditingProduction({
                        ...editingProduction,
                        generalLink: e.target.value,
                        link: e.target.value
                      })}
                      placeholder="https://..."
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2 focus:border-[#C9A227] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Performances List */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-xs font-serif uppercase tracking-widest text-[#C9A227]">
                      2. Performance Dates ({editingProduction.performances.length})
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
                      Review extracted performance dates, start times, venues, ticket links, and statuses
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPerformance}
                    className="flex items-center space-x-1 text-[11px] uppercase tracking-wider text-[#C9A227] hover:text-[#ebd04e] font-medium px-3 py-1.5 bg-[#C9A227]/10 rounded-lg border border-[#C9A227]/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Date</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {editingProduction.performances.map((perf, index) => (
                    <div 
                      key={perf.id || index}
                      className="bg-neutral-900/90 p-3.5 rounded-xl border border-neutral-800 space-y-2.5 text-xs transition-colors hover:border-neutral-700"
                    >
                      {/* Row 1: Date | Start Time | Venue | City | Premiere */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                            Date
                          </label>
                          <input 
                            type="date"
                            value={perf.date}
                            onChange={(e) => handleUpdatePerformance(index, { date: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C9A227] font-mono"
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                            Start Time
                          </label>
                          <input 
                            type="text"
                            value={perf.startTime || ''}
                            onChange={(e) => handleUpdatePerformance(index, { startTime: e.target.value })}
                            placeholder="19:00"
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C9A227] font-mono"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                            Venue / Stage
                          </label>
                          <input 
                            type="text"
                            value={perf.venue || ''}
                            onChange={(e) => handleUpdatePerformance(index, { venue: e.target.value })}
                            placeholder="Werkstattbühne"
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C9A227]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                            City
                          </label>
                          <input 
                            type="text"
                            value={perf.city || ''}
                            onChange={(e) => handleUpdatePerformance(index, { city: e.target.value })}
                            placeholder="Kaiserslautern"
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C9A227]"
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-4">
                          <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={!!perf.isPremiere}
                              onChange={(e) => handleUpdatePerformance(index, { isPremiere: e.target.checked })}
                              className="rounded border-neutral-700 text-[#C9A227] focus:ring-[#C9A227] bg-neutral-950"
                            />
                            <span className={`text-[10px] uppercase tracking-wider font-semibold ${perf.isPremiere ? 'text-[#C9A227]' : 'text-neutral-400'}`}>
                              Premiere
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleDeletePerformance(index)}
                            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Remove date"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Ticket Status | Ticket URL | Notes */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center pt-1 border-t border-neutral-800/60">
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                            Ticket Status
                          </label>
                          <select
                            value={perf.ticketStatus || 'no_ticket'}
                            onChange={(e) => handleUpdatePerformance(index, { ticketStatus: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C9A227]"
                          >
                            <option value="available">Available (Tickets)</option>
                            <option value="sold_out">Sold Out (Ausverkauft)</option>
                            <option value="few_tickets">Few Tickets (Restkarten)</option>
                            <option value="no_ticket">No Ticket Link</option>
                            <option value="free">Free Entry (Kostenlos)</option>
                            <option value="cancelled">Cancelled (Abgesagt)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-6">
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                            Ticket URL
                          </label>
                          <input 
                            type="url"
                            value={perf.ticketUrl || ''}
                            onChange={(e) => handleUpdatePerformance(index, { ticketUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C9A227] font-mono"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                            Notes
                          </label>
                          <input 
                            type="text"
                            value={perf.notes || ''}
                            onChange={(e) => handleUpdatePerformance(index, { notes: e.target.value })}
                            placeholder="Wiederaufnahme, etc."
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C9A227]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 shrink-0 bg-neutral-950">
          {!editingProduction ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={isParsing || !inputText.trim()}
                className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-[#C9A227] text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#ebd04e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing Text...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Parse Schedule</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleResetReview}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Raw Text</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-[#C9A227] text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#ebd04e] transition-colors shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply to Schedule (Draft)</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}


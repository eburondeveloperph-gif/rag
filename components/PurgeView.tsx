
import React, { useState } from 'react';
import { Document } from '../types';

interface PurgeViewProps {
  documents: Document[];
  onExecutePurge: (filter: any) => void;
}

const PurgeView: React.FC<PurgeViewProps> = ({ documents, onExecutePurge }) => {
  const [dryRunActive, setDryRunActive] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [daysFilter, setDaysFilter] = useState(365);
  
  const affectedDocs = documents.filter(d => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysFilter);
    return new Date(d.createdAt) < cutoff;
  });

  const handleExecute = () => {
    if (confirmText === 'CONFIRM PURGE') {
      onExecutePurge({ olderThanDays: daysFilter });
      setDryRunActive(false);
      setConfirmText('');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1D1D1F] tracking-tight">Compliance & Erasure</h1>
          <p className="text-[#86868B] mt-1">GDPR Article 17 Management Tool for Belgian Administrative Units.</p>
        </div>
        <div className="bg-[#34C759]/10 border border-[#34C759]/20 px-4 py-2 rounded-lg text-[#34C759] text-xs font-semibold flex items-center gap-2">
          <i className="fa-solid fa-circle-check"></i>
          APD/GBA Compliant Interface
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E5EA] p-6 shadow-sm">
            <h3 className="font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
              <i className="fa-solid fa-filter text-[#007AFF]"></i>
              Data Lifecycle Filters (RGPD/AVG)
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-[#86868B] uppercase mb-3 tracking-wide">
                  <span>Retention Threshold</span>
                  <span className="text-[#007AFF]">Standard: 365 Days</span>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="3650" 
                    step="30"
                    value={daysFilter}
                    onChange={(e) => setDaysFilter(parseInt(e.target.value))}
                    className="flex-1 accent-[#007AFF]"
                  />
                  <span className="bg-[#F5F5F7] px-3 py-1.5 rounded-lg font-semibold text-[#1D1D1F] min-w-[120px] text-center border border-[#E5E5EA] shadow-sm">
                    {daysFilter} Days
                  </span>
                </div>
                <p className="text-[10px] text-[#86868B] mt-2 italic">Calculated based on royal decree for administrative archiving.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-[#E5E5EA] rounded-xl bg-[#F5F5F7]/50">
                  <p className="text-[10px] text-[#86868B] font-semibold uppercase mb-1 tracking-wide">Erasure Target</p>
                  <p className="text-2xl font-bold text-[#1D1D1F]">{affectedDocs.length} Cases</p>
                  <p className="text-xs text-[#515154]">Scheduled for permanent removal</p>
                </div>
                <div className="p-4 border border-[#E5E5EA] rounded-xl bg-[#F5F5F7]/50">
                  <p className="text-[10px] text-[#86868B] font-semibold uppercase mb-1 tracking-wide">Encrypted Blobs</p>
                  <p className="text-2xl font-bold text-[#1D1D1F]">
                    {(affectedDocs.reduce((acc, d) => acc + d.bytes, 0) / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-[#515154]">Total data footprint reduction</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => setDryRunActive(true)}
                className="w-full bg-[#007AFF] text-white py-3.5 rounded-lg font-semibold hover:bg-[#007AFF]/90 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-file-shield"></i>
                Initialize Compliance Dry-Run
              </button>
            </div>
          </div>

          {dryRunActive && (
            <div className="bg-[#FF3B30]/5 border border-[#FF3B30]/20 rounded-xl p-6 animate-in zoom-in-95 duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-[#FF3B30]/10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-biohazard text-[#FF3B30] text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-[#FF3B30] text-lg">Final Erasure Confirmation</h3>
                  <p className="text-[#FF3B30]/80 text-sm leading-relaxed mt-1">
                    Executing this action will fulfill "Right to Erasure" requests for the {affectedDocs.length} identified cases. 
                    This action is logged in the official BE-Gov administrative record and cannot be reversed.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-[#FF3B30]">
                <div className="space-y-2">
                  <label className="text-xs font-semibold opacity-70 uppercase tracking-wide">Authentication Phrase Required</label>
                  <input 
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="CONFIRM PURGE"
                    className="w-full bg-white border border-[#FF3B30]/30 rounded-lg px-4 py-3 font-semibold placeholder:text-[#FF3B30]/30 focus:outline-none focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20 transition-all text-center tracking-widest"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleExecute}
                    disabled={confirmText !== 'CONFIRM PURGE'}
                    className="flex-1 bg-[#FF3B30] text-white py-3 rounded-lg font-semibold hover:bg-[#FF3B30]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <i className="fa-solid fa-trash-arrow-up"></i>
                    Execute Permanent Erasure
                  </button>
                  <button 
                    onClick={() => { setDryRunActive(false); setConfirmText(''); }}
                    className="px-6 py-3 rounded-lg font-semibold text-[#FF3B30]/70 hover:bg-[#FF3B30]/10 transition-all"
                  >
                    Abort
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E5EA] p-6 shadow-sm">
            <h3 className="font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
              <i className="fa-solid fa-gavel text-[#007AFF] text-sm"></i>
              Legal Framework
            </h3>
            <div className="space-y-4 text-xs text-[#515154] leading-relaxed">
              <p>Purge logic adheres to the <strong>Belgian Federal Archive Law</strong> and <strong>RGPD Article 17</strong>.</p>
              <div className="bg-[#F5F5F7] p-3 rounded-lg border border-[#E5E5EA]">
                <p className="font-semibold text-[#1D1D1F] mb-1">Standard Retention:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Invoices: 7 Years</li>
                  <li>Citizen Data: Variable</li>
                  <li>Logs: 12 Months</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1D1D1F] rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 rounded-lg bg-[#FF9500] flex items-center justify-center">
                  <i className="fa-solid fa-lock text-white text-xs"></i>
               </div>
               <h3 className="font-semibold text-sm">Protected Records</h3>
            </div>
            <p className="text-[11px] opacity-70 leading-relaxed mb-4">Documents marked with high-level sensitivity or active judicial inquiry are automatically locked from the purge engine.</p>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg text-xs font-semibold transition-all border border-white/10">
              Audit Locked Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurgeView;

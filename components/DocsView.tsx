
import React, { useState } from 'react';
import { Document } from '../types';

interface DocsViewProps {
  documents: Document[];
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onToggleProtect: (ids: string[], isProtected: boolean) => void;
  onTriggerOCR: (ids: string[]) => void;
}

const DocsView: React.FC<DocsViewProps> = ({ 
  documents, 
  onUpload, 
  onDelete, 
  onBulkDelete, 
  onToggleProtect,
  onTriggerOCR
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [ocrStatusFilter, setOcrStatusFilter] = useState('');
  const [protectedFilter, setProtectedFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('');

  // Process filtering
  const filteredDocuments = documents.filter(doc => {
    // Search Term
    if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !(doc.metadata?.sender?.toLowerCase() || '').includes(searchTerm.toLowerCase()) && 
        !(doc.metadata?.recipient?.toLowerCase() || '').includes(searchTerm.toLowerCase())) {
      return false;
    }
    // OCR Status
    if (ocrStatusFilter && doc.ocrStatus !== ocrStatusFilter) return false;
    // Protected Status
    if (protectedFilter) {
      const isProtected = protectedFilter === 'true';
      if (!!doc.protected !== isProtected) return false;
    }
    // File Type (mime type simplified)
    if (fileTypeFilter) {
      if (fileTypeFilter === 'pdf' && !doc.mimeType.includes('pdf')) return false;
      if (fileTypeFilter === 'image' && !doc.mimeType.includes('image')) return false;
      if (fileTypeFilter === 'doc' && !(doc.mimeType.includes('word') || doc.mimeType.includes('msword') || doc.mimeType.includes('text'))) return false;
      if (fileTypeFilter === 'spreadsheet' && !(doc.mimeType.includes('csv') || doc.mimeType.includes('excel') || doc.mimeType.includes('spreadsheet'))) return false;
    }
    // Date Range (simple days back)
    if (dateRangeFilter) {
      const daysBack = parseInt(dateRangeFilter, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysBack);
      if (new Date(doc.createdAt) < cutoff) return false;
    }
    return true;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onUpload(e.target.files);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkDeleteAction = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} documents? This action is recorded in the administrative log.`)) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBulkProtectAction = (isProtected: boolean) => {
    onToggleProtect(Array.from(selectedIds), isProtected);
    setSelectedIds(new Set());
  };

  const handleBulkOCRAction = () => {
    onTriggerOCR(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'fa-file-pdf text-red-500';
    if (mimeType.includes('word') || mimeType.includes('msword')) return 'fa-file-word text-blue-600';
    if (mimeType.includes('csv') || mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fa-file-csv text-emerald-600';
    if (mimeType.includes('image')) return 'fa-file-image text-purple-500';
    if (mimeType.includes('text')) return 'fa-file-lines text-slate-500';
    return 'fa-file text-slate-400';
  };

  const handleExportCSV = () => {
    if (documents.length === 0) {
      alert("No documents to export.");
      return;
    }

    const headers = ['Document ID', 'Title', 'Creation Date', 'Size (Bytes)', 'OCR Status'];
    const rows = documents.map(doc => [
      `"${doc.id}"`,
      `"${doc.title.replace(/"/g, '""')}"`,
      `"${new Date(doc.createdAt).toISOString()}"`,
      `"${doc.bytes}"`,
      `"${doc.ocrStatus}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dkm_docs_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1D1D1F] tracking-tight">DKM Logistics Corpus</h1>
          <p className="text-[#86868B] mt-1 text-sm font-medium">Digital repository for Customs Declarations, Transit Docs, and Warehouse Logs.</p>
        </div>
        <div className="flex w-full md:w-auto flex-col items-end gap-3">
          <div className="flex items-center gap-2 bg-[#34C759]/10 border border-[#34C759]/20 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></div>
            <span className="text-[10px] font-semibold text-[#34C759] tracking-widest uppercase">YOLO26 Realtime Ultralytics OCR Active</span>
          </div>
          <div className="flex w-full md:w-auto flex-col md:flex-row gap-3">
            <button
              onClick={handleExportCSV}
              className="w-full md:w-auto bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 border border-[#E5E5EA] shadow-sm active:scale-95"
            >
              <i className="fa-solid fa-file-export"></i>
              <span>Export CSV</span>
            </button>
            <label className="w-full md:w-auto bg-[#007AFF] hover:bg-[#007AFF]/90 text-white px-5 py-2.5 rounded-lg font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm border border-black/5 active:scale-95">
              <i className="fa-solid fa-cloud-arrow-up"></i>
              <span>Ingest Paperwork</span>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleFileSelect} 
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*"
              />
            </label>
          </div>
        </div>
      </header>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E5EA] shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B]"></i>
          <input 
            type="text" 
            placeholder="Search manifests, sender, recipient..." 
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select 
            value={ocrStatusFilter} 
            onChange={(e) => setOcrStatusFilter(e.target.value)}
            className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs font-semibold text-[#1D1D1F] focus:outline-none"
          >
            <option value="">All OCR</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select 
            value={protectedFilter} 
            onChange={(e) => setProtectedFilter(e.target.value)}
            className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs font-semibold text-[#1D1D1F] focus:outline-none"
          >
            <option value="">Hold: All</option>
            <option value="true">Held Only</option>
            <option value="false">Not Held</option>
          </select>
          <select 
            value={fileTypeFilter} 
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs font-semibold text-[#1D1D1F] focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="doc">Document</option>
            <option value="spreadsheet">Spreadsheet</option>
          </select>
          <select 
            value={dateRangeFilter} 
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs font-semibold text-[#1D1D1F] focus:outline-none"
          >
            <option value="">Any Date</option>
            <option value="1">Past 24 Hours</option>
            <option value="7">Past 7 Days</option>
            <option value="30">Past 30 Days</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-white text-[#1D1D1F] p-3 md:p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm border border-[#E5E5EA] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            <span className="font-semibold text-sm">
              {selectedIds.size} files selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button 
              onClick={handleBulkOCRAction}
              className="bg-white hover:bg-[#F5F5F7] text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold transition-all flex items-center gap-2 border border-[#E5E5EA] text-[#1D1D1F] shadow-sm active:scale-95"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-[#007AFF]"></i>
              Trigger OCR
            </button>
            
            <button 
              onClick={() => handleBulkProtectAction(true)}
              className="bg-white hover:bg-[#F5F5F7] text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold transition-all flex items-center gap-2 border border-[#E5E5EA] text-[#1D1D1F] shadow-sm active:scale-95"
            >
              <i className="fa-solid fa-lock text-[#FF9500]"></i>
              Legal Hold
            </button>
            
            <button 
              onClick={() => handleBulkProtectAction(false)}
              className="bg-white hover:bg-[#F5F5F7] text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold transition-all flex items-center gap-2 border border-[#E5E5EA] text-[#1D1D1F] shadow-sm active:scale-95"
            >
              <i className="fa-solid fa-lock-open text-[#86868B]"></i>
              Release
            </button>
            
            <div className="w-px h-6 bg-[#E5E5EA] mx-1 hidden md:block"></div>
            
            <button 
              onClick={handleBulkDeleteAction}
              className="bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-sm border border-black/5 active:scale-95"
            >
              <i className="fa-solid fa-trash-can"></i>
              Purge
            </button>
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) onUpload(e.dataTransfer.files); }}
        className={`border border-dashed rounded-xl p-6 md:p-12 text-center transition-all duration-300 relative overflow-hidden ${
          isDragging ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-[#E5E5EA] bg-white hover:border-[#C7C7CC] shadow-sm'
        }`}
      >
        <div className="relative z-10">
          <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-[#F5F5F7] rounded-[1.25rem] flex items-center justify-center mb-6">
            <i className="fa-solid fa-truck-fast text-[#007AFF] text-2xl md:text-3xl"></i>
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-[#1D1D1F] mb-2">DKM Customs File Ingestion</h3>
          <p className="text-[#86868B] text-xs md:text-sm mb-6 max-w-md mx-auto">
            Drop your Import/Export Manifests, Veterinary Certificates (CHED-P), T1 Transit forms, or Bill of Ladings here for automatic intelligence extraction.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-[10px] md:text-xs font-semibold">
            <span className="bg-[#F5F5F7] px-3 py-1.5 rounded text-[#515154] border border-[#E5E5EA] tracking-wide">Antwerp Hub</span>
            <span className="bg-[#F5F5F7] px-3 py-1.5 rounded text-[#515154] border border-[#E5E5EA] tracking-wide">Zeebrugge Hub</span>
            <span className="bg-[#F5F5F7] px-3 py-1.5 rounded text-[#515154] border border-[#E5E5EA] tracking-wide">PLDA / NCTS</span>
          </div>
        </div>
        {isDragging && <div className="absolute inset-0 bg-[#007AFF]/5 animate-pulse"></div>}
      </div>

      {/* Docs List */}
      <div className="bg-white rounded-xl border border-[#E5E5EA] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[850px]">
            <thead className="bg-[#F5F5F7]/80 border-b border-[#E5E5EA] text-[10px] md:text-xs backdrop-blur-sm">
              <tr>
                <th className="px-4 md:px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[#C7C7CC] text-[#007AFF] focus:ring-[#007AFF]/20 transition-all"
                  />
                </th>
                <th className="px-4 md:px-6 py-4 font-semibold text-[#86868B] uppercase tracking-wider">Logistics Asset</th>
                <th className="px-4 md:px-6 py-4 font-semibold text-[#86868B] uppercase tracking-wider">AI Intelligence extraction</th>
                <th className="px-4 md:px-6 py-4 font-semibold text-[#86868B] uppercase tracking-wider text-center">Cycle Status</th>
                <th className="px-4 md:px-6 py-4 font-semibold text-[#86868B] uppercase tracking-wider text-center w-40">OCR Engine</th>
                <th className="px-4 md:px-6 py-4 font-semibold text-[#86868B] uppercase tracking-wider">Registry Date</th>
                <th className="px-4 md:px-6 py-4 font-semibold text-[#86868B] uppercase tracking-wider text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] text-sm text-[#1D1D1F]">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="max-w-xs mx-auto opacity-50 grayscale">
                       <i className="fa-solid fa-box-open text-5xl mb-4 block text-[#86868B]"></i>
                       <p className="font-semibold text-[#1D1D1F] tracking-wide text-xs">Repository Exhausted</p>
                       <p className="text-xs mt-1 text-[#86868B]">No active shipment records detected in this node.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className={`hover:bg-[#F5F5F7] transition-all group cursor-pointer ${selectedIds.has(doc.id) ? 'bg-[#007AFF]/5' : ''}`}
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <td className="px-4 md:px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="w-4 h-4 rounded border-[#C7C7CC] text-[#007AFF] focus:ring-[#007AFF]/20 transition-all"
                      />
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center text-lg shrink-0">
                          <i className={`fa-solid ${getFileIcon(doc.mimeType)} text-[#86868B]`}></i>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-[#1D1D1F] text-xs md:text-sm truncate">{doc.title}</p>
                            {doc.protected && (
                              <span className="bg-[#FF9500]/10 text-[#FF9500] text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border border-[#FF9500]/20 flex items-center gap-1 shrink-0">
                                <i className="fa-solid fa-lock text-[8px]"></i>
                                Hold
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#86868B] font-medium tracking-tight">
                            <span>{(doc.bytes / 1024).toFixed(0)} KB</span>
                            <span className="w-1 h-1 bg-[#C7C7CC] rounded-full"></span>
                            <span>{doc.sourceType}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      {doc.metadata ? (
                        <div className="text-[10px] md:text-xs">
                          <p><strong className="text-[#86868B] uppercase tracking-wider">From:</strong> {doc.metadata.sender || 'Unknown'}</p>
                          <p><strong className="text-[#86868B] uppercase tracking-wider">To:</strong> {doc.metadata.recipient || 'Unknown'}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#C7C7CC] italic">No extraction data</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide border ${
                        doc.status === 'ready' ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' : 
                        doc.status === 'processing' ? 'bg-[#007AFF]/10 text-[#007AFF] animate-pulse border-[#007AFF]/20' : 
                        doc.status === 'error' ? 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20' :
                        'bg-[#F5F5F7] text-[#86868B] border-[#E5E5EA]'
                      }`}>
                        {doc.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center relative group/tooltip w-40">
                      <div className="flex flex-col items-center justify-center gap-1 w-full">
                        <div className="flex items-center justify-center gap-2">
                          {doc.ocrStatus === 'pending' ? (
                            <i className="fa-solid fa-circle-notch fa-spin text-[#007AFF] text-[10px]"></i>
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${
                              doc.ocrStatus === 'completed' ? 'bg-[#34C759]' :
                              doc.ocrStatus === 'failed' ? 'bg-[#FF3B30]' : 'bg-[#C7C7CC]'
                            }`}></div>
                          )}
                          <span className={`text-[10px] md:text-xs font-semibold tracking-wide ${
                            doc.ocrStatus === 'failed' ? 'text-[#FF3B30] underline decoration-dotted decoration-[#FF3B30]/50 cursor-help' : 'text-[#515154]'
                          }`}>
                            {doc.ocrStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        {doc.ocrStatus === 'pending' && doc.ocrProgress !== undefined && (
                          <div className="w-full h-1 bg-[#E5E5EA] rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-[#007AFF] transition-all duration-300" style={{width: `${doc.ocrProgress}%`}}></div>
                          </div>
                        )}
                      </div>
                      
                      {doc.ocrStatus === 'failed' && (doc.ocrErrorMessage || doc.text) && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 md:w-64 p-3 bg-white text-[#1D1D1F] border border-[#FF3B30]/30 rounded-xl shadow-xl shadow-[#FF3B30]/10 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-white text-left font-medium leading-relaxed">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#FF3B30]/10 flex flex-shrink-0 items-center justify-center text-[#FF3B30]">
                               <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>
                            </div>
                            <div className="flex-1">
                               <p className="text-[10px] font-bold text-[#FF3B30] uppercase tracking-wider mb-1">OCR Engine Fault</p>
                               <span className="text-xs break-words whitespace-normal text-slate-600 block">{doc.ocrErrorMessage || doc.text}</span>
                               <a href="/audit" className="text-[10px] font-bold text-[#007AFF] mt-2 inline-block hover:underline cursor-pointer pointer-events-auto">View Audit Trace &rarr;</a>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                       <div className="text-xs text-[#515154] font-medium">
                          {new Date(doc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                       </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all transform md:group-hover:translate-x-0 md:translate-x-2">
                        {doc.fileData && (
                          <a 
                            href={doc.fileData} 
                            download={doc.title}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[#86868B] hover:text-[#007AFF] hover:bg-[#007AFF]/5"
                            title="Download original file"
                          >
                            <i className="fa-solid fa-download"></i>
                          </a>
                        )}
                        <button 
                          onClick={() => onDelete(doc.id)}
                          disabled={doc.protected}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            doc.protected ? 'text-[#E5E5EA] bg-transparent cursor-not-allowed' : 'text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/5'
                          }`}
                          title={doc.protected ? "Protected shipment record" : "Purge record"}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}></div>
          <div className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 md:p-6 border-b border-[#E5E5EA] flex justify-between items-center bg-[#F5F5F7]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center shadow-sm">
                  <i className={`fa-solid ${getFileIcon(previewDoc.mimeType)} text-[#86868B] text-lg`}></i>
                </div>
                <div>
                  <h2 className="font-semibold text-[#1D1D1F] text-lg truncate max-w-sm md:max-w-xl">{previewDoc.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-[#86868B] mt-0.5 font-medium">
                    <span>{new Date(previewDoc.createdAt).toLocaleString()}</span>
                    <span className="w-1 h-1 bg-[#C7C7CC] rounded-full"></span>
                    <span>{(previewDoc.bytes / 1024).toFixed(0)} KB</span>
                    <span className="w-1 h-1 bg-[#C7C7CC] rounded-full"></span>
                    <span className="uppercase">{previewDoc.sourceType}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="w-10 h-10 rounded-full bg-white border border-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors flex items-center justify-center shadow-sm"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-[#F5F5F7] flex flex-col md:flex-row gap-6">
              <div className="bg-white border border-[#E5E5EA] rounded-xl shadow-sm overflow-hidden flex-1 min-h-[50vh]">
                {previewDoc.mimeType.startsWith('image/') ? (
                  <div className="flex items-center justify-center p-6 min-h-[50vh] bg-[#F5F5F7]/50">
                    <img 
                      src={previewDoc.fileData} 
                      alt={previewDoc.title} 
                      className="max-w-full max-h-[60vh] object-contain rounded-lg border border-[#E5E5EA] shadow-sm"
                    />
                  </div>
                ) : previewDoc.text && previewDoc.ocrStatus === 'completed' ? (
                  <div className="p-6 md:p-10 text-sm md:text-base leading-relaxed text-[#1D1D1F] whitespace-pre-wrap font-sans">
                    {previewDoc.text}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center p-6">
                    <i className="fa-solid fa-file-invoice text-6xl text-[#E5E5EA] mb-4"></i>
                    <h3 className="text-lg font-semibold text-[#1D1D1F] mb-2">No preview available</h3>
                    <p className="text-[#86868B] text-sm max-w-sm">
                      This file format cannot be previewed directly, or the text extraction has not completed yet.
                    </p>
                    {previewDoc.fileData && (
                      <a 
                        href={previewDoc.fileData} 
                        download={previewDoc.title}
                        className="mt-6 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-sm"
                      >
                        <i className="fa-solid fa-download"></i>
                        Download File
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              {previewDoc.metadata && (
                <div className="w-full md:w-80 bg-white border border-[#E5E5EA] rounded-xl shadow-sm p-5 space-y-4 flex-shrink-0">
                  <div className="flex items-center gap-2 text-[#007AFF] border-b border-[#E5E5EA] pb-3">
                    <i className="fa-solid fa-microchip"></i>
                    <h3 className="font-bold text-sm tracking-wide uppercase">AI Intelligence</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] mb-1">Sender</p>
                       <p className="text-sm font-semibold text-[#1D1D1F]">{previewDoc.metadata.sender}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] mb-1">Recipient</p>
                       <p className="text-sm font-semibold text-[#1D1D1F]">{previewDoc.metadata.recipient}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] mb-1">Document Date</p>
                       <p className="text-sm font-medium text-[#1D1D1F]">{previewDoc.metadata.documentDate}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] mb-1">Executive Summary</p>
                       <p className="text-xs text-[#515154] leading-relaxed p-3 bg-[#F5F5F7] rounded-lg border border-[#E5E5EA]">{previewDoc.metadata.summary}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[#E5E5EA] bg-white flex justify-between items-center text-xs text-[#86868B] font-medium">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1D1D1F]">ID:</span> <span className="font-mono text-[10px] bg-[#F5F5F7] px-2 py-0.5 rounded text-[#515154] border border-[#E5E5EA]">{previewDoc.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1D1D1F]">OCR Status:</span> 
                <span className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wide border ${
                  previewDoc.ocrStatus === 'completed' ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' : 
                  previewDoc.ocrStatus === 'pending' ? 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20' : 
                  previewDoc.ocrStatus === 'failed' ? 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20' :
                  'bg-[#F5F5F7] text-[#86868B] border-[#E5E5EA]'
                }`}>
                  {previewDoc.ocrStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocsView;

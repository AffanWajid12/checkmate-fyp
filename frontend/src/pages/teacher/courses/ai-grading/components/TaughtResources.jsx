import React from 'react';
import toast from 'react-hot-toast';

export default function TaughtResources({ 
    isUploading, 
    resources = [], 
    onUpload, 
    onClear 
}) {
    return (
        <div className="mb-10 bg-accent-50/10 border border-accent-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h4 className="text-sm font-bold text-accent-700 uppercase tracking-widest">Taught Resources (RAG)</h4>
                    <p className="text-[11px] text-text-muted mt-1">Upload lecture notes, slides, or chapters the AI should use as reference context.</p>
                </div>
                <label className={`px-4 py-2 rounded-xl bg-accent-600 text-white text-xs font-bold hover:bg-accent-700 transition-all cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 shadow-md shadow-accent-600/10'}`}>
                    {isUploading ? (
                        <div className="flex items-center gap-2">
                             <span className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                             Uploading...
                        </div>
                    ) : '+ Upload Resource'}
                    <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.txt,.pptx"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                onUpload(e.target.files[0]);
                            }
                        }}
                        disabled={isUploading}
                    />
                </label>
            </div>

            {resources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {resources.map(filename => (
                        <div key={filename} className="bg-white border border-accent-100 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-accent-300 transition-all group">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center text-accent-500 flex-shrink-0 group-hover:bg-accent-100 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-medium text-text-primary truncate">{filename}</span>
                            </div>
                            <button 
                                onClick={() => toast.success("Delete feature in development!")}
                                className="text-neutral-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 border-2 border-dashed border-accent-100 rounded-xl bg-white/50">
                    <p className="text-[11px] text-accent-400 font-medium italic">No taught resources uploaded yet. AI will grade based on rubric only.</p>
                </div>
            )}

            {resources.length > 0 && (
                <button 
                    onClick={() => {
                        if (window.confirm("Clear all resources for this assessment?")) {
                            onClear();
                        }
                    }}
                    className="mt-4 text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Resources
                </button>
            )}
        </div>
    );
}

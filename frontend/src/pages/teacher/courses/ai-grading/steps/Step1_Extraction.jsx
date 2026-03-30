import React from 'react';

export default function Step1_Extraction({ 
    onExtract, 
    isExtracting, 
    isScanned, 
    setIsScanned 
}) {
    return (
        <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-12 text-center space-y-4 max-w-2xl mx-auto mt-12 bg-white">
            <div className="w-20 h-20 rounded-full bg-accent-50 flex items-center justify-center mx-auto text-accent-500 mb-4 ring-8 ring-accent-50/50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <circle cx="10" cy="13" r="2" />
                    <path d="M11.5 14.5L14 17" />
                </svg>
            </div>
            <h3 className="text-2xl font-black text-text-primary">Extract Assessment Blueprint</h3>
            <p className="text-sm text-text-secondary">
                We'll use DeepSeek OCR and AI to automatically extract, classify, and structure the questions from the source materials attached to this assessment.
            </p>

            <div className="flex flex-col items-center justify-center gap-2 mt-8 mb-4">
                <div className="flex items-center gap-1 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200 shadow-inner">
                    <button
                        onClick={() => setIsScanned(true)}
                        className={`px-5 py-3 rounded-xl justify-center text-sm font-bold transition-all flex items-center gap-2 ${isScanned ? 'bg-white shadow-md text-primary border border-neutral-100' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'}`}
                    >
                        Scanned/Handwritten
                        <span className="text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded-md font-mono">OCR</span>
                    </button>
                    <button
                        onClick={() => setIsScanned(false)}
                        className={`px-5 py-3 rounded-xl justify-center text-sm font-bold transition-all flex items-center gap-2 ${!isScanned ? 'bg-white shadow-md text-primary border border-neutral-100' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'}`}
                    >
                        Digital Document
                        <span className="text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded-md font-mono">TXT</span>
                    </button>
                </div>
            </div>

            <button
                onClick={onExtract}
                disabled={isExtracting}
                className="mt-6 w-full px-8 py-4 rounded-2xl bg-primary text-text-inverse text-base font-bold hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
            >
                {isExtracting ? (
                    <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Analyzing Document...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Start AI Extraction
                    </>
                )}
            </button>
            {isExtracting && <p className="text-[11px] text-text-muted mt-4 font-medium italic">Our AI is reading your PDF. This typically takes 30-60 seconds.</p>}
        </div>
    );
}

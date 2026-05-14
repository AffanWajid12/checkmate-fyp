import React from 'react';

export const InlineResourceViewer = ({ resource }) => {
    if (!resource) return (
        <div className="h-full flex items-center justify-center text-text-muted text-sm font-medium bg-neutral-50">
            No resource selected.
        </div>
    );

    const { file_name, mime_type, signed_url } = resource;

    const renderContent = () => {
        if (!mime_type) {
            // Fallback for missing mime_type
            if (file_name.match(/\.(jpg|jpeg|png|gif)$/i)) {
                return <img src={signed_url} alt={file_name} className="max-w-full max-h-full object-contain" />;
            }
            if (file_name.match(/\.pdf$/i)) {
                return <iframe src={`${signed_url}#toolbar=0`} title={file_name} className="w-full h-full border-none" />;
            }
        }

        if (mime_type?.startsWith('image/')) {
            return (
                <img 
                    src={signed_url} 
                    alt={file_name} 
                    className="max-w-full max-h-full object-contain"
                />
            );
        }

        if (mime_type?.startsWith('video/')) {
            return (
                <video 
                    src={signed_url} 
                    controls 
                    className="max-w-full max-h-full"
                >
                    Your browser does not support the video tag.
                </video>
            );
        }

        if (mime_type === 'application/pdf' || file_name.toLowerCase().endsWith('.pdf')) {
            return (
                <iframe 
                    src={`${signed_url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`} 
                    title={file_name}
                    className="w-full h-full border-none"
                />
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-12 bg-neutral-50 h-full text-center">
                <div className="w-16 h-16 bg-neutral-200 rounded-2xl flex items-center justify-center mb-4 text-neutral-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <p className="text-sm font-bold text-text-primary mb-2">Preview not available</p>
                <p className="text-xs text-text-muted mb-6 max-w-[200px]">This file type ({mime_type || 'unknown'}) cannot be previewed directly.</p>
                <a 
                    href={signed_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-neutral-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all"
                >
                    Download File
                </a>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-white relative flex items-center justify-center overflow-hidden">
            {renderContent()}
        </div>
    );
};

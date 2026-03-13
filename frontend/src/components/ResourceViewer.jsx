import React from 'react';
import { XMarkIcon } from '../pages/teacher/courses/CoursePage/components/Icons';

export const ResourceViewer = ({ resource, onClose }) => {
    if (!resource) return null;

    const { file_name, mime_type, signed_url } = resource;

    const renderContent = () => {
        if (mime_type.startsWith('image/')) {
            return (
                <img 
                    src={signed_url} 
                    alt={file_name} 
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
            );
        }

        if (mime_type.startsWith('video/')) {
            return (
                <video 
                    src={signed_url} 
                    controls 
                    autoPlay 
                    className="max-w-full max-h-[80vh] rounded-lg"
                >
                    Your browser does not support the video tag.
                </video>
            );
        }

        if (mime_type === 'application/pdf') {
            return (
                <iframe 
                    src={`${signed_url}#toolbar=0`} 
                    title={file_name}
                    className="w-full h-[80vh] rounded-lg"
                />
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-12 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
                <p className="text-sm text-text-secondary mb-4">Preview not available for this file type.</p>
                <a 
                    href={signed_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 bg-primary text-text-inverse rounded-xl font-semibold hover:bg-primary-hover transition-colors"
                >
                    Download {file_name}
                </a>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl bg-background rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                    <h3 className="text-sm font-bold text-text-primary truncate">{file_name}</h3>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-text-muted hover:text-red-500 cursor-pointer"
                    >
                        <XMarkIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 flex items-center justify-center bg-neutral-900/5 min-h-[40vh]">
                    {renderContent()}
                </div>

                {/* Footer / Actions */}
                <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-3">
                    <a 
                        href={signed_url} 
                        download={file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                    >
                        Open in New Tab
                    </a>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-neutral-100 text-text-primary text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

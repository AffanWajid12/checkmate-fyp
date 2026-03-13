// ─── Inline Announcement Form ─────────────────────────────────────────────────
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAddAnnouncement } from '../../../../../hooks/useCourses';
import { MegaphoneIcon, PaperclipIcon, XMarkIcon } from './Icons';

export const PostAnnouncementForm = ({ courseId, onCancel }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);
    const { mutate: addAnnouncement, isPending } = useAddAnnouncement(courseId);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePost = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', body.trim());
        files.forEach((file) => {
            formData.append('files', file);
        });

        addAnnouncement(
            { formData },
            {
                onSuccess: () => {
                    toast.success('Announcement posted!');
                    onCancel();
                },
                onError: (err) => {
                    const msg = err?.response?.data?.message || 'Failed to post announcement.';
                    toast.error(msg);
                },
            }
        );
    };

    return (
        <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5 mb-6">
            <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <MegaphoneIcon />
                Post an Announcement
            </h2>
            <form onSubmit={handlePost} className="space-y-3">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title…"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                />
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your announcement here…"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all resize-none"
                />

                {/* File List */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg text-xs text-text-secondary border border-neutral-200">
                                <span className="max-w-[150px] truncate">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                                >
                                    <XMarkIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center pt-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary text-xs font-medium hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                        <PaperclipIcon />
                        Attach Files
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                    />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2.5 rounded-xl border border-neutral-200 text-text-secondary text-sm font-semibold hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || !body.trim() || isPending}
                            className="px-5 py-2.5 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                        >
                            {isPending ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Posting…
                                </>
                            ) : 'Post'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

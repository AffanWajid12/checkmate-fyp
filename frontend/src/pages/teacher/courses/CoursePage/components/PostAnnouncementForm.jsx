// ─── Inline Announcement Form ─────────────────────────────────────────────────
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAddAnnouncement } from '../../../../../hooks/useCourses';
import { MegaphoneIcon } from './Icons';

export const PostAnnouncementForm = ({ courseId, onCancel }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const { mutate: addAnnouncement, isPending } = useAddAnnouncement(courseId);

    const handlePost = (e) => {
        e.preventDefault();
        addAnnouncement(
            { title: title.trim(), description: body.trim() },
            {
                onSuccess: () => {
                    toast.success('Announcement posted!');
                    onCancel();
                },
                onError: () => toast.error('Failed to post announcement.'),
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
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2.5 rounded-xl border border-neutral-200 text-text-secondary text-sm font-semibold hover:bg-neutral-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!title.trim() || !body.trim() || isPending}
                        className="px-5 py-2.5 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
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
            </form>
        </div>
    );
};

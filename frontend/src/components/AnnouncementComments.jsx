import { useState } from 'react';
import { useMe } from '../hooks/useAuth';
import { useAddAnnouncementComment, useDeleteAnnouncementComment } from '../hooks/useCourses';

const timeAgoShort = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString();
};

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const MessageIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mr-2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);

const ChevronIcon = ({ isOpen }) => (
    <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
    >
        <path d="M6 9l6 6 6-6" />
    </svg>
);

export const AnnouncementComments = ({ courseId, announcementId, comments = [] }) => {
    const { data: user } = useMe();
    const [newComment, setNewComment] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    const addCommentMutation = useAddAnnouncementComment(courseId, announcementId);
    const deleteCommentMutation = useDeleteAnnouncementComment(courseId, announcementId);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim() || addCommentMutation.isPending) return;

        addCommentMutation.mutate(
            { content: newComment.trim() },
            {
                onSuccess: () => {
                    setNewComment("");
                }
            }
        );
    };

    const handleDelete = (commentId) => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            deleteCommentMutation.mutate({ commentId });
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-col gap-3 transition-all duration-300 ">
            {/* Toggle Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center text-text-muted hover:text-accent-600 transition-colors py-1 group w-fit cursor-pointer"
            >
                <MessageIcon />
                <span className="text-xs font-bold mr-2">
                    {comments.length} class comment{comments.length !== 1 ? 's' : ''}
                </span>
                <ChevronIcon isOpen={isExpanded} />
            </button>

            {isExpanded && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    {comments.length > 0 && (
                        <div className="space-y-3">
                            {comments.map((comment) => {
                                const isAuthor = user?.id === comment.user_id;
                                const isTeacher = user?.role === "TEACHER";
                                const canDelete = isAuthor || isTeacher;

                                return (
                                    <div key={comment.id} className="flex items-start gap-2 group">
                                        {/* Avatar */}
                                        <div className="w-7 h-7 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden border border-neutral-200">
                                            {(() => {
                                                console.log(`Comment ${comment.id} user PFP:`, comment.user.profile_picture);
                                                return null;
                                            })()}
                                            {comment.user.profile_picture && comment.user.profile_picture.trim() !== "" ? (
                                                <img 
                                                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profiles/${comment.user.profile_picture}`} 
                                                    alt={comment.user.name} 
                                                    className="w-full h-full object-cover"
                                                    onLoad={() => console.log(`Image loaded successfully for comment ${comment.id}`)}
                                                    onError={(e) => {
                                                        console.error(`Image FAILED for comment ${comment.id}. URL:`, e.target.src);
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <span className={`text-[10px] font-bold text-accent-700 ${comment.user.profile_picture && comment.user.profile_picture.trim() !== "" ? 'hidden' : 'flex'}`}>
                                                {comment.user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="text-xs font-bold text-text-primary truncate">
                                                        {comment.user.name}
                                                    </span>
                                                    {comment.user.role === "TEACHER" && (
                                                        <span className="text-[9px] font-bold bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                            Teacher
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-[10px] text-text-muted">
                                                        {timeAgoShort(comment.createdAt)}
                                                    </span>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(comment.id)}
                                                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-opacity disabled:opacity-50 cursor-pointer"
                                                            disabled={deleteCommentMutation.isPending}
                                                            title="Delete comment"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Comment Input */}
                    <form onSubmit={handleSubmit} className="flex items-end gap-2 mt-1">
                        <div className="flex-1 bg-white border border-neutral-200 rounded-xl overflow-hidden focus-within:border-accent-300 focus-within:ring-1 focus-within:ring-accent-100 transition-all">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a class comment..."
                                className="w-full text-sm bg-transparent border-0 px-3 py-2.5 outline-none resize-none max-h-32 min-h-[40px] text-text-primary placeholder:text-text-muted transition-all"
                                rows="1"
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newComment.trim() || addCommentMutation.isPending}
                            className="h-10 px-4 flex items-center justify-center rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 active:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Post
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

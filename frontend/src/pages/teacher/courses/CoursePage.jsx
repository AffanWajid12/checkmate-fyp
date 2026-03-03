import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    useCourseAnnouncements,
    useAddAnnouncement,
    useTeacherCourses,
} from '../../../hooks/useCourses';

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

const MegaphoneIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
);

const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const CopyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Announcement Card ────────────────────────────────────────────────────────

const AnnouncementCard = ({ announcement }) => (
    <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-sm font-bold text-text-primary leading-snug">{announcement.title}</h3>
            <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0 mt-0.5">
                {timeAgo(announcement.createdAt)}
            </span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {announcement.description}
        </p>
    </div>
);

const AnnouncementSkeleton = () => (
    <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5 animate-pulse">
        <div className="flex items-start justify-between gap-4 mb-3">
            <div className="h-4 bg-neutral-200 rounded w-2/3" />
            <div className="h-3 bg-neutral-200 rounded w-16" />
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-neutral-200 rounded w-full" />
            <div className="h-3 bg-neutral-200 rounded w-4/5" />
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherCoursePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [newTitle, setNewTitle] = useState('');
    const [newBody, setNewBody] = useState('');

    const { data: courses = [] } = useTeacherCourses();
    const course = courses.find((c) => c.id === courseId);
    const studentCount = course?.students?.length ?? 0;

    const { data: announcements = [], isLoading } = useCourseAnnouncements(courseId);
    const { mutate: addAnnouncement, isPending } = useAddAnnouncement(courseId);

    const handlePost = (e) => {
        e.preventDefault();
        addAnnouncement(
            { title: newTitle.trim(), description: newBody.trim() },
            {
                onSuccess: () => {
                    toast.success('Announcement posted!');
                    setNewTitle('');
                    setNewBody('');
                },
                onError: () => {
                    toast.error('Failed to post announcement.');
                },
            }
        );
    };

    const handleCopyCode = () => {
        if (!course?.code) return;
        navigator.clipboard.writeText(course.code).then(() => toast.success('Code copied!'));
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back + Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
                >
                    <BackIcon />
                    Back to Courses
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">
                            {course?.title ?? 'Course'}
                        </h1>
                        {course && (
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {/* Code badge + copy */}
                                <button
                                    onClick={handleCopyCode}
                                    className="flex items-center gap-1.5 font-mono text-sm font-semibold text-accent-500 bg-accent-50 border border-accent-100 px-2.5 py-0.5 rounded-full hover:bg-accent-100 transition-colors"
                                >
                                    {course.code}
                                    <CopyIcon />
                                </button>
                                <span className="flex items-center gap-1 text-sm text-text-secondary">
                                    <UsersIcon />
                                    {studentCount} student{studentCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Mark Attendance CTA */}
                    <button
                        onClick={() => navigate(`/teacher/courses/${courseId}/attendance`)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors flex-shrink-0"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <path d="M9 16l2 2 4-4" />
                        </svg>
                        Mark Attendance
                    </button>
                </div>
            </div>

            {/* Post Announcement Form */}
            <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5 mb-6">
                <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <MegaphoneIcon />
                    Post an Announcement
                </h2>
                <form onSubmit={handlePost} className="space-y-3">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Title…"
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                    />
                    <textarea
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        placeholder="Write your announcement here…"
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all resize-none"
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!newTitle.trim() || !newBody.trim() || isPending}
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

            {/* Announcements stream */}
            <div className="mb-4 flex items-center gap-2">
                <MegaphoneIcon />
                <h2 className="text-base font-bold text-text-primary">Past Announcements</h2>
                {!isLoading && (
                    <span className="ml-auto text-xs text-text-muted">
                        {announcements.length} post{announcements.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {isLoading && (
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => <AnnouncementSkeleton key={i} />)}
                </div>
            )}

            {!isLoading && announcements.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[20vh] text-center px-6">
                    <p className="text-sm text-text-secondary">
                        No announcements yet. Post one above to get started.
                    </p>
                </div>
            )}

            {!isLoading && announcements.length > 0 && (
                <div className="space-y-4">
                    {announcements.map((a) => (
                        <AnnouncementCard key={a.id} announcement={a} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherCoursePage;

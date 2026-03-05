import { useState, useRef, useEffect } from 'react';
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

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const SmallPlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const CalendarCheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M9 16l2 2 4-4" />
    </svg>
);

const ClipboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
);

const SpeakerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 010 7.07" />
        <path d="M19.07 4.93a10 10 0 010 14.14" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
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

const formatDueDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const TYPE_META = {
    QUIZ:       { label: 'Quiz',       color: 'bg-blue-50 text-blue-600 border-blue-100' },
    ASSIGNMENT: { label: 'Assignment', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    EXAM:       { label: 'Exam',       color: 'bg-amber-50 text-amber-600 border-amber-100' },
};

// ─── Assessment Chip ──────────────────────────────────────────────────────────

const AssessmentChip = ({ assessment, courseId }) => {
    const navigate = useNavigate();
    const meta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;
    return (
        <button
            onClick={() => navigate(`/teacher/courses/${courseId}/assessments/${assessment.id}`)}
            className="group inline-flex items-center gap-2 text-xs font-medium bg-accent-50 text-accent-500 border border-accent-100 px-3 py-1.5 rounded-full hover:bg-accent-100 transition-colors"
        >
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.color}`}>
                {meta.label}
            </span>
            <span>{assessment.title}</span>
            {assessment.due_date && (
                <span className="text-text-muted hidden sm:inline">· Due {formatDueDate(assessment.due_date)}</span>
            )}
            <ArrowRightIcon />
        </button>
    );
};

// ─── Announcement Card ────────────────────────────────────────────────────────

const AnnouncementCard = ({ announcement, courseId, onAddAssessment }) => (
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

        {/* Assessment chips */}
        {announcement.assessments?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-2">
                {announcement.assessments.map((a) => (
                    <AssessmentChip key={a.id} assessment={a} courseId={courseId} />
                ))}
            </div>
        )}

        {/* Add Assessment link */}
        <div className="mt-3 pt-2 flex justify-end">
            <button
                onClick={() => onAddAssessment(announcement.id)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-500 transition-colors"
            >
                <SmallPlusIcon />
                Add Assessment
            </button>
        </div>
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

// ─── Inline Announcement Form ─────────────────────────────────────────────────

const PostAnnouncementForm = ({ courseId, onCancel }) => {
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

// ─── FAB + Popover Drawer ─────────────────────────────────────────────────────

const FABMenu = ({ courseId, onAddAnnouncement }) => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const actions = [
        {
            label: 'Mark Attendance',
            icon: <CalendarCheckIcon />,
            colorClass: 'text-text-primary hover:bg-neutral-100',
            onClick: () => { setOpen(false); navigate(`/teacher/courses/${courseId}/attendance`); },
        },
        {
            label: 'Add Assessment',
            icon: <ClipboardIcon />,
            colorClass: 'text-accent-500 hover:bg-accent-50',
            onClick: () => { setOpen(false); navigate(`/teacher/courses/${courseId}/add-assessment`); },
        },
        {
            label: 'Add Announcement',
            icon: <SpeakerIcon />,
            colorClass: 'text-text-primary hover:bg-neutral-100',
            onClick: () => { setOpen(false); onAddAnnouncement(); },
        },
    ];

    return (
        <div ref={ref} className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
            {open && (
                <div className="flex flex-col gap-1.5 mb-2">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-background border border-neutral-200 shadow-lg text-sm font-semibold transition-colors ${action.colorClass}`}
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-14 h-14 rounded-full bg-primary text-text-inverse shadow-xl flex items-center justify-center hover:bg-primary-hover transition-all active:scale-95"
                aria-label="Actions"
            >
                <span className={`transition-transform duration-200 ${open ? 'rotate-45' : 'rotate-0'}`} style={{ display: 'flex' }}>
                    <PlusIcon />
                </span>
            </button>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherCoursePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);

    const { data: courses = [] } = useTeacherCourses();
    const course = courses.find((c) => c.id === courseId);
    const studentCount = course?.students?.length ?? 0;

    const { data: announcements = [], isLoading } = useCourseAnnouncements(courseId);

    const handleCopyCode = () => {
        if (!course?.code) return;
        navigator.clipboard.writeText(course.code).then(() => toast.success('Code copied!'));
    };

    const handleAddAssessment = (announcementId) => {
        navigate(`/teacher/courses/${courseId}/add-assessment?announcementId=${announcementId}`);
    };

    return (
        <div className="max-w-3xl mx-auto pb-28">
            {/* Back + Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
                >
                    <BackIcon />
                    Back to Courses
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        {course?.title ?? 'Course'}
                    </h1>
                    {course && (
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
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
            </div>

            {/* Inline Announcement Form */}
            {showForm && (
                <PostAnnouncementForm courseId={courseId} onCancel={() => setShowForm(false)} />
            )}

            {/* Announcements stream header */}
            <div className="mb-4 flex items-center gap-2">
                <MegaphoneIcon />
                <h2 className="text-base font-bold text-text-primary">Announcements</h2>
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
                        No announcements yet. Use the <strong className="text-text-primary">+</strong> button below to get started.
                    </p>
                </div>
            )}

            {!isLoading && announcements.length > 0 && (
                <div className="space-y-4">
                    {announcements.map((a) => (
                        <AnnouncementCard
                            key={a.id}
                            announcement={a}
                            courseId={courseId}
                            onAddAssessment={handleAddAssessment}
                        />
                    ))}
                </div>
            )}

            {/* Floating Action Button */}
            <FABMenu courseId={courseId} onAddAnnouncement={() => setShowForm(true)} />
        </div>
    );
};

export default TeacherCoursePage;

import { useParams, useNavigate } from 'react-router-dom';
import { useCourseAnnouncements, useEnrolledCourses } from '../../../hooks/useCourses';

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

const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M9 16l2 2 4-4" />
    </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(iso);
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
        {announcement.assessments?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-2">
                {announcement.assessments.map((a) => (
                    <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-accent-50 text-accent-500 border border-accent-100 px-2.5 py-1 rounded-full"
                    >
                        📎 {a.title}
                    </span>
                ))}
            </div>
        )}
    </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const AnnouncementSkeleton = () => (
    <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5 animate-pulse">
        <div className="flex items-start justify-between gap-4 mb-3">
            <div className="h-4 bg-neutral-200 rounded w-2/3" />
            <div className="h-3 bg-neutral-200 rounded w-16" />
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-neutral-200 rounded w-full" />
            <div className="h-3 bg-neutral-200 rounded w-4/5" />
            <div className="h-3 bg-neutral-200 rounded w-3/5" />
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const CoursePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const { data: courses = [] } = useEnrolledCourses();
    const course = courses.find((c) => c.id === courseId);

    const { data: announcements = [], isLoading } = useCourseAnnouncements(courseId);

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

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">
                            {course?.title ?? 'Course'}
                        </h1>
                        {course && (
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-text-secondary font-medium">{course.code}</span>
                                <span className="text-text-muted">·</span>
                                <span className="text-sm text-text-secondary">
                                    {course.teacher?.name ?? 'Instructor'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Attendance shortcut */}
                    <button
                        onClick={() => navigate(`/student/courses/${courseId}/attendance`)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-50 border border-accent-100 text-accent-500 text-sm font-semibold hover:bg-accent-100 transition-colors flex-shrink-0"
                    >
                        <CalendarIcon />
                        My Attendance
                    </button>
                </div>
            </div>

            {/* Announcements stream */}
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
                    {[...Array(3)].map((_, i) => <AnnouncementSkeleton key={i} />)}
                </div>
            )}

            {!isLoading && announcements.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[30vh] text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent-50 border border-accent-100 flex items-center justify-center mb-3">
                        <MegaphoneIcon />
                    </div>
                    <h3 className="text-base font-bold text-text-primary mb-1">No announcements yet</h3>
                    <p className="text-sm text-text-secondary">
                        Your instructor hasn't posted anything yet. Check back soon.
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

export default CoursePage;

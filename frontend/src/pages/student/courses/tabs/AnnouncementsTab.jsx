import { useNavigate } from 'react-router-dom';
import { useCourseAnnouncements } from '../../../../hooks/useCourses';
import { AnnouncementComments } from '../../../../components/AnnouncementComments';

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

const MegaphoneIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
);

const TYPE_META = {
    QUIZ: { label: 'Quiz', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    ASSIGNMENT: { label: 'Assignment', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    EXAM: { label: 'Exam', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
};

const AnnouncementCard = ({ announcement, courseId }) => {
    const navigate = useNavigate();
    const assessments = announcement?.assessments ?? [];

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-bold text-text-primary leading-snug">{announcement.title}</h3>
                <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0 mt-0.5">
                    {timeAgo(announcement.createdAt)}
                </span>
            </div>

            {assessments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {assessments.map((a) => {
                        const meta = TYPE_META[a.type] ?? { label: a.type ?? 'Assessment', bg: 'bg-neutral-50', text: 'text-text-secondary', border: 'border-neutral-200' };
                        return (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => navigate(`/student/courses/${courseId}/assessments/${a.id}`)}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${meta.bg} ${meta.border} ${meta.text} text-xs font-semibold hover:opacity-90 transition`}
                                title={a.title}
                            >
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                {meta.label}: <span className="truncate max-w-[220px]">{a.title}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {announcement.description}
            </p>

            <AnnouncementComments
                courseId={courseId}
                announcementId={announcement.id}
                comments={announcement.comments}
            />
        </div>
    );
};

const AnnouncementSkeleton = () => (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 animate-pulse">
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

const AnnouncementsTab = ({ courseId }) => {
    const { data: announcements = [], isLoading } = useCourseAnnouncements(courseId);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
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
                    <p className="text-sm text-text-secondary">No announcements yet.</p>
                </div>
            )}

            {!isLoading && announcements.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} courseId={courseId} />
            ))}
        </div>
    );
};

export default AnnouncementsTab;

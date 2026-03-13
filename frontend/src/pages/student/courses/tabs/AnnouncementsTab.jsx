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

const AnnouncementCard = ({ announcement, courseId }) => {
    return (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-bold text-text-primary leading-snug">{announcement.title}</h3>
                <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0 mt-0.5">
                    {timeAgo(announcement.createdAt)}
                </span>
            </div>
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

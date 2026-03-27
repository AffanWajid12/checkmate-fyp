import { useNavigate } from 'react-router-dom';
import { useCourseAnnouncements } from '../../../../hooks/useCourses';
import { AnnouncementComments } from '../../../../components/AnnouncementComments';

const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatBytes = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

// ─── Icons ────────────────────────────────────────────────────────────────────

const MegaphoneIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
);

const LinkIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
);

const FileIcon = ({ mime }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        className={`w-4 h-4 flex-shrink-0 ${mime === 'application/pdf' ? 'text-red-500' : 'text-blue-500'}`}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

// ─── Components ───────────────────────────────────────────────────────────────

const AnnouncementCard = ({ announcement, courseId }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-bold text-text-primary leading-snug">{announcement.title}</h3>
                <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0 mt-0.5">
                    {timeAgo(announcement.createdAt)}
                </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line mb-4">
                {announcement.description}
            </p>

            {/* Render any attached resources */}
            {announcement.resources && announcement.resources.length > 0 && (
                <div className="mb-4 space-y-2">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                        {announcement.resources.map((res) => (
                            <a
                                key={res.id}
                                href={res.signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-accent-300 hover:bg-accent-50 transition-colors text-sm"
                            >
                                <FileIcon mime={res.mime_type} />
                                <span className="text-text-primary truncate max-w-[180px]">{res.file_name}</span>
                                <span className="text-text-muted text-xs hidden sm:inline">{formatBytes(res.file_size)}</span>
                                <ExternalLinkIcon />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Render linked assessments */}
            {announcement.assessments && announcement.assessments.length > 0 && (
                <div className="mb-4 space-y-2">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Linked Assessments</p>
                    <div className="flex flex-wrap gap-2">
                        {announcement.assessments.map((assessment) => (
                            <button
                                key={assessment.id}
                                onClick={() => navigate(`/student/courses/${courseId}/assessments/${assessment.id}`)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 border border-primary-200 hover:bg-primary hover:text-white hover:border-primary text-primary-700 transition-colors text-sm font-medium"
                            >
                                <LinkIcon />
                                {assessment.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseAnnouncements } from '../../../../../hooks/useCourses';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { AnnouncementSkeleton } from '../components/AnnouncementSkeleton';
import { PostAnnouncementForm } from '../components/PostAnnouncementForm';
import { MegaphoneIcon } from '../components/Icons';

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const AnnouncementsTab = ({ courseId }) => {
    const [showForm, setShowForm] = useState(false);
    const navigate = useNavigate();
    const { data: announcements = [], isLoading, isError } = useCourseAnnouncements(courseId);

    const handleAddAssessment = (announcementId) => {
        navigate(`/teacher/courses/${courseId}/add-assessment?announcementId=${announcementId}`);
    };

    return (
        <div className="space-y-4">
            {/* Header + Add button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MegaphoneIcon />
                    <h2 className="text-base font-bold text-text-primary">Announcements</h2>
                    {!isLoading && (
                        <span className="text-xs text-text-muted ml-1">
                            ({announcements.length})
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                    <PlusIcon />
                    New Announcement
                </button>
            </div>

            {/* Inline Announcement Form */}
            {showForm && (
                <PostAnnouncementForm courseId={courseId} onCancel={() => setShowForm(false)} />
            )}

            {/* Loading */}
            {isLoading && (
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => <AnnouncementSkeleton key={i} />)}
                </div>
            )}

            {/* Error */}
            {isError && (
                <div className="flex flex-col items-center justify-center min-h-[20vh] text-center px-6">
                    <p className="text-sm text-error bg-error/10 px-4 py-2 rounded-xl">
                        Failed to load announcements. Please try again later.
                    </p>
                </div>
            )}

            {/* Empty */}
            {!isLoading && announcements.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[20vh] text-center px-6">
                    <p className="text-sm text-text-secondary">
                        No announcements yet. Click <strong className="text-text-primary">New Announcement</strong> to get started.
                    </p>
                </div>
            )}

            {/* Announcement Cards */}
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
        </div>
    );
};

export default AnnouncementsTab;

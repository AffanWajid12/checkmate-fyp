// ─── Announcement Card ────────────────────────────────────────────────────────
import { useState } from 'react';
import { timeAgo } from '../utils/helpers';
import { AssessmentChip } from './AssessmentChip';
import { SmallPlusIcon, FilePdfIcon, FileImageIcon, FileVideoIcon, GenericFileIcon } from './Icons';
import { AnnouncementComments } from '../../../../../components/AnnouncementComments';
import { ResourceViewer } from '../../../../../components/ResourceViewer';

const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <FileImageIcon />;
    if (mimeType.startsWith('video/')) return <FileVideoIcon />;
    if (mimeType === 'application/pdf') return <FilePdfIcon />;
    return <GenericFileIcon />;
};

export const AnnouncementCard = ({ announcement, courseId, onAddAssessment }) => {
    const [viewingResource, setViewingResource] = useState(null);

    return (
        <div className=" bg-[#ffffff] rounded-2xl border border-neutral-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-bold text-text-primary leading-snug">{announcement.title}</h3>
                <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0 mt-0.5">
                    {timeAgo(announcement.createdAt)}
                </span>
            </div>
            <p className="text-sm text-black leading-relaxed whitespace-pre-line">
                {announcement.description}
            </p>

            {/* Resources Section */}
            {announcement.resources?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {announcement.resources.map((res) => (
                        <button
                            key={res.id}
                            onClick={() => setViewingResource(res)}
                            className="flex items-center gap-2 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-all group cursor-pointer"
                        >
                            <span className="text-text-muted group-hover:text-primary transition-colors">
                                {getFileIcon(res.mime_type)}
                            </span>
                            <span className="text-xs font-medium text-text-secondary truncate max-w-[120px]">
                                {res.file_name}
                            </span>
                        </button>
                    ))}
                </div>
            )}

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
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-500 transition-colors cursor-pointer"
                >
                    <SmallPlusIcon />
                    Add Assessment
                </button>
            </div>

            {/* Comments Section */}
            <AnnouncementComments 
                courseId={courseId} 
                announcementId={announcement.id} 
                comments={announcement.comments} 
            />

            {/* Resource Viewer Modal */}
            {viewingResource && (
                <ResourceViewer 
                    resource={viewingResource} 
                    onClose={() => setViewingResource(null)} 
                />
            )}
        </div>
    );
};

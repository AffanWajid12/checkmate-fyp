// ─── Announcement Card ────────────────────────────────────────────────────────
import { useState, useRef } from 'react';
import { timeAgo } from '../utils/helpers';
import { AssessmentChip } from './AssessmentChip';
import { FilePdfIcon, FileImageIcon, FileVideoIcon, GenericFileIcon, PencilIcon, PaperclipIcon, XMarkIcon } from './Icons';
import { AnnouncementComments } from '../../../../../components/AnnouncementComments';
import { ResourceViewer } from '../../../../../components/ResourceViewer';
import { TrashIcon } from './Icons';
import { useDeleteAnnouncement, useUpdateAnnouncement } from '../../../../../hooks/useCourses';
import toast from 'react-hot-toast';

const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return <FilePdfIcon />;
    if (mimeType?.includes('image')) return <FileImageIcon />;
    if (mimeType?.includes('video')) return <FileVideoIcon />;
    return <GenericFileIcon />;
};

export const AnnouncementCard = ({ announcement, courseId }) => {
    const [viewingResource, setViewingResource] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(announcement.title);
    const [editDescription, setEditDescription] = useState(announcement.description);
    const [newFiles, setNewFiles] = useState([]);
    const fileInputRef = useRef(null);

    const { mutateAsync: deleteAnnouncement, isPending: isDeleting } = useDeleteAnnouncement(courseId);
    const { mutateAsync: updateAnnouncement, isPending: isUpdating } = useUpdateAnnouncement(courseId);

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this announcement? This will also delete any associated assessments and cannot be undone.')) {
            return;
        }

        try {
            await deleteAnnouncement(announcement.id);
            toast.success('Announcement deleted successfully');
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error(error.response?.data?.message || 'Failed to delete announcement');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', editTitle.trim());
        formData.append('description', editDescription.trim());
        newFiles.forEach((file) => formData.append('files', file));

        try {
            await updateAnnouncement({ announcementId: announcement.id, formData });
            toast.success('Announcement updated');
            setIsEditing(false);
            setNewFiles([]);
        } catch (error) {
            console.error('Update failed:', error);
            toast.error(error.response?.data?.message || 'Failed to update announcement');
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setNewFiles((prev) => [...prev, ...selectedFiles]);
    };

    const removeNewFile = (index) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const hasAssessment = (announcement.assessments?.length ?? 0) > 0;

    return (
        <div className=" bg-[#ffffff] rounded-2xl border border-neutral-200 shadow-sm p-5 relative group/card">
            {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-accent-400"
                        placeholder="Announcement Title"
                    />
                    <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
                    />

                    {/* New Files List */}
                    {newFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {newFiles.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-neutral-100 rounded-lg text-[10px] border">
                                    <span className="max-w-[100px] truncate">{f.name}</span>
                                    <button type="button" onClick={() => removeNewFile(i)} className="text-text-muted hover:text-error"><XMarkIcon /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-primary transition-colors"
                        >
                            <PaperclipIcon /> Attach More
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary hover:bg-neutral-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="px-5 py-2 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
                            >
                                {isUpdating ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-text-primary leading-snug">{announcement.title}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs text-text-muted whitespace-nowrap mt-0.5 mr-2">
                                {timeAgo(announcement.createdAt)}
                            </span>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 rounded-lg text-text-muted hover:text-accent-500 hover:bg-accent-50 transition-all opacity-0 group-hover/card:opacity-100 cursor-pointer"
                                title="Edit Announcement"
                            >
                                <PencilIcon size={16} />
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover/card:opacity-100 disabled:opacity-50 cursor-pointer"
                                title="Delete Announcement"
                            >
                                {isDeleting ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <TrashIcon size={16} />
                                )}
                            </button>
                        </div>
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
                    {hasAssessment && (
                        <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-2">
                            {announcement.assessments.map((a) => (
                                <AssessmentChip key={a.id} assessment={a} courseId={courseId} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Comments Section */}
            {!isEditing && (
                <AnnouncementComments 
                    courseId={courseId} 
                    announcementId={announcement.id} 
                    comments={announcement.comments} 
                />
            )}

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

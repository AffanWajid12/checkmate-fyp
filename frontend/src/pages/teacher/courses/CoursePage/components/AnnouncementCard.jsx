// ─── Announcement Card ────────────────────────────────────────────────────────
import { timeAgo } from '../utils/helpers';
import { AssessmentChip } from './AssessmentChip';
import { SmallPlusIcon } from './Icons';
import { AnnouncementComments } from '../../../../../components/AnnouncementComments';

export const AnnouncementCard = ({ announcement, courseId, onAddAssessment }) => (
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

        {/* Comments Section */}
        <AnnouncementComments 
            courseId={courseId} 
            announcementId={announcement.id} 
            comments={announcement.comments} 
        />
    </div>
);

// filepath: backend/src/utils/assessmentAnnouncementTemplates.js

const TYPE_LABELS = {
    ASSIGNMENT: "Assignment",
    QUIZ: "Quiz",
    EXAM: "Exam",
};

const formatDueDateForAnnouncement = (dueDate) => {
    if (!dueDate) return null;
    const d = dueDate instanceof Date ? dueDate : new Date(dueDate);
    if (Number.isNaN(d.getTime())) return null;

    // Stable, readable format (server-side). Example: "Mar 25, 2026 11:59 PM"
    return d.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const defaultIntroLineForType = (type, dueDate) => {
    const label = TYPE_LABELS[type] ?? "Assessment";
    const due = formatDueDateForAnnouncement(dueDate);

    switch (type) {
        case "ASSIGNMENT":
            return due ? `A new ${label.toLowerCase()} has been posted. Due: ${due}.` : `A new ${label.toLowerCase()} has been posted.`;
        case "QUIZ":
            return due ? `A new ${label.toLowerCase()} has been posted. Due: ${due}.` : `A new ${label.toLowerCase()} has been posted.`;
        case "EXAM":
            return due ? `A new ${label.toLowerCase()} has been posted. Scheduled/Due: ${due}.` : `A new ${label.toLowerCase()} has been posted.`;
        default:
            return due ? `A new assessment has been posted. Due: ${due}.` : `A new assessment has been posted.`;
    }
};

/**
 * Builds the auto-generated announcement for an assessment.
 * Requirements:
 * - Announcement title is generated and must include teacher's assessment title.
 * - Announcement description must include: "Instructions:" + teacher-entered instructions.
 */
export const buildAssessmentAnnouncement = ({ type, assessmentTitle, dueDate, instructions }) => {
    const label = TYPE_LABELS[type] ?? "Assessment";
    const due = formatDueDateForAnnouncement(dueDate);

    const titleBase = `New ${label}: ${assessmentTitle}`;
    const title = due ? `${titleBase} (Due ${due})` : titleBase;

    const safeInstructions = (instructions ?? "").toString().trim();
    const instructionsBlock = safeInstructions.length ? safeInstructions : "No instructions provided.";

    const intro = defaultIntroLineForType(type, dueDate);

    const description = `${intro}\n\nInstructions:\n${instructionsBlock}`;

    return { title, description };
};

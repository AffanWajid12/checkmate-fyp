import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateCourse } from '../../../hooks/useCourses';

const CopyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
);

const CreateCourseDialog = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [createdCourse, setCreatedCourse] = useState(null); // holds the newly created course
    const { mutate: createCourse, isPending } = useCreateCourse();

    if (!isOpen) return null;

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setCreatedCourse(null);
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createCourse(
            { title: title.trim(), description: description.trim() || undefined },
            {
                onSuccess: (course) => {
                    setCreatedCourse(course);
                },
                onError: () => {
                    toast.error('Failed to create course. Please try again.');
                },
            }
        );
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(createdCourse.code).then(() => {
            toast.success('Course code copied!');
        });
    };

    // ── Step 2: success view showing the generated code ──────────
    if (createdCourse) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={handleClose} />
                <div className="relative z-10 bg-background rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md mx-4 p-8">
                    {/* Success icon */}
                    <div className="flex justify-center mb-5">
                        <div className="w-14 h-14 rounded-full bg-success-light border border-green-200 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7 text-success">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-text-primary text-center mb-1">
                        Course Created!
                    </h2>
                    <p className="text-sm text-text-secondary text-center mb-6">
                        Share the code below with your students so they can enroll.
                    </p>

                    {/* Course info */}
                    <div className="bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-3 mb-4">
                        <p className="text-xs text-text-muted mb-0.5">Course title</p>
                        <p className="text-sm font-semibold text-text-primary">{createdCourse.title}</p>
                    </div>

                    {/* Code display */}
                    <div className="bg-accent-50 border border-accent-100 rounded-xl px-5 py-4 flex items-center justify-between mb-6">
                        <div>
                            <p className="text-xs text-text-muted mb-1">Course Code</p>
                            <p className="text-2xl font-bold tracking-widest text-accent-500 font-mono">
                                {createdCourse.code}
                            </p>
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-accent-100 text-accent-500 text-xs font-semibold hover:bg-accent-100 transition-colors"
                        >
                            <CopyIcon />
                            Copy
                        </button>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full py-3 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    // ── Step 1: creation form ─────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative z-10 bg-background rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md mx-4 p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">Create a Course</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            A unique enrollment code will be generated automatically.
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-neutral-100"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="courseTitle" className="block text-sm font-semibold text-text-primary mb-2">
                            Course Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="courseTitle"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Introduction to Computer Science"
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-sm"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label htmlFor="courseDescription" className="block text-sm font-semibold text-text-primary mb-2">
                            Description <span className="text-text-muted font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="courseDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what students will learn…"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-sm resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || isPending}
                            className="flex-1 py-3 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Creating…
                                </>
                            ) : (
                                'Create Course'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCourseDialog;

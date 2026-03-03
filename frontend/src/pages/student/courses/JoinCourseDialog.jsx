import { useState } from 'react';
import toast from 'react-hot-toast';
import { useEnrollInCourse } from '../../../hooks/useCourses';

const JoinCourseDialog = ({ isOpen, onClose }) => {
    const [courseCode, setCourseCode] = useState('');
    const { mutate: enroll, isPending } = useEnrollInCourse();

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        enroll(
            { code: courseCode.trim().toUpperCase() },
            {
                onSuccess: () => {
                    toast.success('Enrolled successfully!');
                    setCourseCode('');
                    onClose();
                },
                onError: (error) => {
                    const status = error?.response?.status;
                    if (status === 404) {
                        toast.error('Course not found. Check the code and try again.');
                    } else if (status === 409) {
                        toast.error('You are already enrolled in this course.');
                    } else {
                        toast.error('Something went wrong. Please try again.');
                    }
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative z-10 bg-background rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md mx-4 p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">Join a Course</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Enter the course code provided by your instructor.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
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
                        <label htmlFor="courseCode" className="block text-sm font-semibold text-text-primary mb-2">
                            Course Code
                        </label>
                        <input
                            id="courseCode"
                            type="text"
                            value={courseCode}
                            onChange={(e) => setCourseCode(e.target.value)}
                            placeholder="e.g. CS101-A"
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-sm"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>                        <button
                            type="submit"
                            disabled={!courseCode.trim() || isPending}
                            className="flex-1 py-3 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Joining…
                                </>
                            ) : (
                                'Join Course'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JoinCourseDialog;

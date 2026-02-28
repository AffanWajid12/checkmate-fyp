import { useState } from 'react';

const JoinCourseDialog = ({ isOpen, onClose }) => {
    const [courseCode, setCourseCode] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: handle join course logic
        setCourseCode('');
        onClose();
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
                        </button>
                        <button
                            type="submit"
                            disabled={!courseCode.trim()}
                            className="flex-1 py-3 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Join Course
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JoinCourseDialog;

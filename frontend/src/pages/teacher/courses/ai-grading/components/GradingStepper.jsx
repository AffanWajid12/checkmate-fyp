import React from 'react';

const steps = ['Extract', 'Blueprint', 'Pairing', 'Review', 'Grading Setup', 'Select Students', 'Results'];

export default function GradingStepper({ currentStep, onStepClick }) {
    return (
        <div className="flex bg-white items-center gap-2 mb-8 bg-neutral-50 p-4 rounded-xl border border-neutral-200 overflow-x-auto custom-scrollbar">
            {steps.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;
                const isClickable = stepNum <= currentStep; // Allow jumping back to any past step or current step

                return (
                    <div
                        key={label}
                        onClick={() => isClickable && onStepClick?.(stepNum)}
                        className={`flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${isClickable ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-not-allowed'}`}
                    >
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-small transition-all duration-300 ${isActive ? 'bg-primary text-white scale-110 shadow-md shadow-primary/20' : isCompleted ? 'bg-success text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                            {isCompleted ? '✓' : stepNum}
                        </div>
                        <span className={`text-sm transition-colors ${isActive ? ' underline-offset-4 decoration-1' : isCompleted ? 'text-text-primary group-hover:text-primary' : 'text-neutral-400 '}`}>
                            {label}
                        </span>
                        {stepNum < steps.length && <div className="w-8 h-[1px] bg-neutral-300 mx-2" />}
                    </div>
                );
            })}
        </div>
    );
}

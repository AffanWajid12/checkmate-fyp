// ─── FAB + Popover Drawer ─────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheckIcon, ClipboardIcon, SpeakerIcon, PlusIcon } from './Icons';

export const FABMenu = ({ courseId, onAddAnnouncement }) => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const actions = [
        {
            label: 'Mark Attendance',
            icon: <CalendarCheckIcon />,
            colorClass: 'text-text-primary hover:bg-neutral-100',
            onClick: () => { setOpen(false); navigate(`/teacher/courses/${courseId}/attendance`); },
        },
        {
            label: 'Add Assessment',
            icon: <ClipboardIcon />,
            colorClass: 'text-accent-500 hover:bg-accent-50',
            onClick: () => { setOpen(false); navigate(`/teacher/courses/${courseId}/add-assessment`); },
        },
        {
            label: 'Add Announcement',
            icon: <SpeakerIcon />,
            colorClass: 'text-text-primary hover:bg-neutral-100',
            onClick: () => { setOpen(false); onAddAnnouncement(); },
        },
    ];

    return (
        <div ref={ref} className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
            {open && (
                <div className="flex flex-col gap-1.5 mb-2">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-background border border-neutral-200 shadow-lg text-sm font-semibold transition-colors ${action.colorClass}`}
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-14 h-14 rounded-full bg-primary text-text-inverse shadow-xl flex items-center justify-center hover:bg-primary-hover transition-all active:scale-95"
                aria-label="Actions"
            >
                <span className={`transition-transform duration-200 ${open ? 'rotate-45' : 'rotate-0'}`} style={{ display: 'flex' }}>
                    <PlusIcon />
                </span>
            </button>
        </div>
    );
};

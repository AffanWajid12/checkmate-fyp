import { useState } from "react";
import { useDeleteUser } from "../hooks/useUsers";
import toast from "react-hot-toast";

const DeleteUserModal = ({ user, onClose }) => {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const deleteUser = useDeleteUser();

    const handleDelete = async () => {
        setError(null);
        setDeleting(true);
        try {
            await deleteUser.mutateAsync(user.id);
            toast.success("User deleted");
            onClose();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message ?? err?.message ?? "Failed to delete user.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative z-10 bg-background rounded-3xl shadow-2xl border border-neutral-100 w-full max-w-md mx-4 overflow-hidden">
                {/* Top accent line - red for danger */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

                <div className="px-8 pt-8 pb-6">
                    {/* Modal Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-500">
                                    <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                                    <path d="M10 11v6M14 11v6" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold tracking-tight text-text-primary">Delete User</h2>
                                <p className="text-text-secondary text-sm mt-1">This action cannot be undone.</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-text-muted hover:text-text-primary transition-colors mt-1"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="mb-6 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                        <p className="text-sm text-text-secondary mb-1">You are about to delete:</p>
                        <p className="font-semibold text-text-primary">{user.name ?? "Unnamed User"}</p>
                        <p className="text-sm text-text-secondary">{user.email}</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-full border border-neutral-200 text-sm font-semibold text-text-secondary hover:bg-neutral-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 py-3 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {deleting ? "Deleting…" : "Delete User"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteUserModal;

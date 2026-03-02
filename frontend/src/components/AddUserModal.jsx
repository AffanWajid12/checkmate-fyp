import { useState } from "react";
import apiClient from "../utils/apiClient";
import supabase from "../utils/supabaseClient";
import toast from "react-hot-toast";

const ROLES = ["STUDENT", "TEACHER", "ADMIN"];
const DEFAULT_PASSWORD = "12345678";
const defaultForm = { name: "", email: "", role: "STUDENT", password: DEFAULT_PASSWORD };

const AddUserModal = ({ onClose, onUserAdded }) => {
    const [form, setForm] = useState(defaultForm);
    const [useDefault, setUseDefault] = useState(true);
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const jwt = session?.access_token;

            const { data: { newUser } } = await apiClient.post("/admin/users", form, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            onUserAdded(newUser);
            toast.success("User created successfully");
            onClose();
        } catch (err) {
            console.error(err);
            setFormError(err.response?.data?.message ?? "Failed to create user.");
            toast.error(err.response?.data?.message ?? "Failed to create user.");
        } finally {
            setSubmitting(false);
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
                {/* Top accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-accent-400 to-transparent" />

                <div className="px-8 pt-8 pb-6">
                    {/* Modal Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-extrabold tracking-tight text-text-primary">Add New User</h2>
                            <p className="text-text-secondary text-sm mt-1">Fill in the details to create a new account.</p>
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

                    {/* Error */}
                    {formError && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-text-primary">Name</label>
                            <input
                                type="text"
                                required
                                placeholder="John Doe"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-text-primary">Email</label>
                            <input
                                type="email"
                                required
                                placeholder="john@example.com"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-text-primary">Password</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                disabled={useDefault}
                                value={form.password}
                                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
                                <div
                                    onClick={() => {
                                        const next = !useDefault;
                                        setUseDefault(next);
                                        setForm((f) => ({ ...f, password: next ? DEFAULT_PASSWORD : "" }));
                                    }}
                                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                                        useDefault
                                            ? "bg-primary border-primary"
                                            : "bg-neutral-50 border-neutral-300"
                                    }`}
                                >
                                    {useDefault && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-xs text-text-secondary">
                                    Use default password{" "}
                                    <span className="font-mono font-semibold text-text-primary">{DEFAULT_PASSWORD}</span>
                                </span>
                            </label>
                        </div>

                        {/* Role */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-text-primary">Role</label>
                            <div className="relative">
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                                >
                                    {ROLES.map((r) => (
                                        <option key={r} value={r}>
                                            {r.charAt(0) + r.slice(1).toLowerCase()}
                                        </option>
                                    ))}
                                </select>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                    className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-full border border-neutral-200 text-sm font-semibold text-text-secondary hover:bg-neutral-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-3 rounded-full bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Creating…" : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddUserModal;

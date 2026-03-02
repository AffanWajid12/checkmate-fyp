import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

import apiClient from "../../utils/apiClient";
import supabase from "../../utils/supabaseClient";
import AddUserModal from "../../components/AddUserModal";

const ROLE_STYLES = {
    ADMIN:    "bg-primary text-text-inverse",
    TEACHER:  "bg-accent-50 text-accent-500 border border-accent-100",
    STUDENT:  "bg-neutral-100 text-text-secondary",
};

const columns = ["ID", "Name", "Email", "Role", "Created At", "Updated At"];

const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const jwt = session?.access_token;
                
                const { data: { users } } = await apiClient.get("/admin/users", {
                    headers: { Authorization: `Bearer ${jwt}` },
                });
                setUsers(users);
            } catch (err) {
                console.error(err);
                setError("Failed to load users.");
                toast.error("Failed to load users.");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const [updatingRole, setUpdatingRole] = useState(null);

    const handleRoleChange = async (userId, newRole) => {
        setUpdatingRole(userId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const jwt = session?.access_token;

            await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            setUsers((prev) =>
                prev.map((u) => u.id === userId ? { ...u, role: newRole } : u)
            );
            toast.success("User role updated successfully");
        } catch (err) {
            console.error(err);
            toast.error(`Failed to update user role: ${err.response?.data?.message ?? err.message}`);
        } finally {
            setUpdatingRole(null);
        }
    };

    return (
        <div className="flex min-h-screen bg-background-secondary font-sans">
            <main className="flex-1 p-8 overflow-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">User Management</h1>
                        <p className="text-text-secondary text-sm mt-1">View and manage all registered users.</p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-text-inverse px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-hover transition-all shadow-sm hover:shadow-md"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add User
                    </button>
                </div>

                {/* Table Card */}
                <div className="bg-background rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 gap-4 flex-wrap">
                        <div className="relative max-w-xs w-full">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search users…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                            />
                        </div>
                        <span className="text-xs text-text-muted font-medium whitespace-nowrap">
                            {users.length} {users.length === 1 ? "user" : "users"}
                        </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100">
                                    {columns.map((col) => (
                                        <th key={col} className="text-left px-6 py-3 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-text-muted text-sm">
                                            <div className="flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4 animate-spin text-accent-400" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                                                </svg>
                                                Loading users…
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && error && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-sm text-red-500 font-medium">
                                            {error}
                                        </td>
                                    </tr>
                                )}

                                {!loading && !error && users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-text-muted text-sm">
                                            No users found.
                                        </td>
                                    </tr>
                                )}

                                {!loading && !error && users.map((user, idx) => (
                                    <tr
                                        key={user.id}
                                        className={`border-b border-neutral-50 hover:bg-neutral-50 transition-colors ${idx % 2 === 0 ? "" : "bg-neutral-50/40"}`}
                                    >
                                        <td className="px-6 py-4 font-mono text-xs text-text-muted whitespace-nowrap">
                                            {user.id}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-text-primary whitespace-nowrap">
                                            {user.name ?? "—"}
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative w-32">
                                                <select
                                                    value={user.role}
                                                    disabled={updatingRole === user.id}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className={`w-full pl-2.5 pr-7 py-1 rounded-full text-xs font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-400 transition-all border ${
                                                        ROLE_STYLES[user.role] ?? ROLE_STYLES.STUDENT
                                                    } ${updatingRole === user.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                                >
                                                    {["STUDENT", "TEACHER", "ADMIN"].map((r) => (
                                                        <option key={r} value={r} className="bg-background text-text-primary font-medium">
                                                            {r.charAt(0) + r.slice(1).toLowerCase()}
                                                        </option>
                                                    ))}
                                                </select>
                                                {updatingRole === user.id ? (
                                                    <svg className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-current pointer-events-none" viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                                        className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <path d="M6 9l6 6 6-6" />
                                                    </svg>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                                            {formatDate(user.updatedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {modalOpen && (
                <AddUserModal
                    onClose={() => setModalOpen(false)}
                    onUserAdded={(newUser) => setUsers((prev) => [newUser, ...prev])}
                />
            )}
        </div>
    );
};

export default UserManagement;

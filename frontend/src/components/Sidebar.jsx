import { NavLink } from "react-router-dom";
import { useLogout } from "../hooks/useAuth";
import logo from "../logo.png";


const navItems = [
    {
        label: "Dashboard",
        to: "/admin",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        label: "User Management",
        to: "/admin/users",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
];

const Sidebar = () => {
    const { mutateAsync: logout, isPending: loading, error } = useLogout();

    return (
        <aside className="h-screen w-64 bg-background border-r border-neutral-100 flex flex-col font-sans text-text-primary sticky top-0">
            {/* Brand */}
            <div className="flex items-center gap-2 px-6 py-5 border-b border-neutral-100">
                <div className="bg-primary p-1 rounded-lg">
                    <img src={logo} alt="Checkmate Logo" className="h-8 w-auto" />
                </div>
                <span className="text-lg font-bold tracking-tight">Checkmate</span>
            </div>

            {/* Role badge */}
            <div className="px-6 pt-5 pb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-100">
                    <span className="w-2 h-2 rounded-full bg-accent-400"></span>
                    <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">Admin Panel</span>
                </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-4 pt-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? "bg-primary text-text-inverse shadow-sm"
                                : "text-text-secondary hover:bg-neutral-50 hover:text-text-primary"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className={isActive ? "text-text-inverse" : "text-text-muted"}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-neutral-100">
                <button className="flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors w-full"
                    onClick={logout}
                    disabled={loading}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-text-muted">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../components/AuthContext";
import logo from "../logo.png";

import { useLogin } from "../hooks/useAuth";

const LoginPage = () => {
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const navigate = useNavigate();

    const { mutateAsync: login, isPending: loading, error } = useLogin();
    const { user, loading: authLoading } = useAuthContext();

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            await login({
                email: emailRef.current.value,
                password: passwordRef.current.value
            });
        }
        catch (error) {
            console.error("Login error:", error);
        }
    };

    useEffect(() => {
        if (user) {
            const role = user?.role;
            if (role === "TEACHER") {
                navigate("/teacher/dashboard");
            } else if (role === "ADMIN") {
                navigate("/admin");
            } else if (role === "STUDENT") {
                navigate("/student/dashboard");
            }
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-background font-sans text-text-primary flex flex-col">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
                <a href="/" className="flex items-center gap-2">
                    <div className="bg-primary p-1 rounded-lg">
                        <img src={logo} alt="Checkmate Logo" className="h-10 w-auto" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Checkmate</span>
                </a>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">

                    {/* Card */}
                    <div className="bg-background rounded-3xl shadow-2xl p-8 border border-neutral-100 relative overflow-hidden">
                        {/* Subtle glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-accent-400 to-transparent"></div>

                        <div className="mb-8">
                            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Welcome back</h1>
                            <p className="text-text-secondary text-sm">Sign in to your Checkmate account</p>
                        </div>

                        {error && (
                            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
                                {error.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="block text-sm font-semibold text-text-primary">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    ref={emailRef}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder-text-muted text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="block text-sm font-semibold text-text-primary">
                                        Password
                                    </label>
                                    <a href="#" className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                                        Forgot password?
                                    </a>
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    required
                                    ref={passwordRef}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder-text-muted text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || authLoading}
                                className="w-full cursor-pointer bg-primary text-text-inverse py-3.5 rounded-full text-sm font-semibold hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                            >
                                {loading || authLoading ? "Signing in…" : "Sign in"}
                            </button>
                        </form>

                        {/* <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-xs text-text-muted">
                            By signing in, you agree to our{" "}
                            <a href="#" className="text-text-secondary hover:text-text-primary font-medium transition-colors">Terms of Service</a>
                            {" "}and{" "}
                            <a href="#" className="text-text-secondary hover:text-text-primary font-medium transition-colors">Privacy Policy</a>.
                        </div> */}
                    </div>
                </div>
            </main>

            {/* Glow Effect */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-400/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
        </div>
    );
};

export default LoginPage;

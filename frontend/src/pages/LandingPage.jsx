import { useNavigate } from 'react-router-dom';
import logo from '../logo.png';
import fastLogo from '../Fast_Logo.png';

const LandingPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background font-sans text-text-primary">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">

                <div className="flex items-center gap-2">
                    <div className="bg-primary p-1 rounded-lg">
                        <img src={logo} alt="Checkmate Logo" className="h-10 w-auto" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Checkmate</span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
                </div>

                <div className="flex items-center gap-4">
                    <a href="/login" className="text-sm font-medium hover:text-text-primary transition-colors">Log In</a>
                    <button className="bg-primary text-text-inverse px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors">
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 pt-12 pb-20 lg:pt-20 lg:pb-32 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Content */}
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-100">
                        <span className="w-2 h-2 rounded-full bg-accent-400"></span>
                        <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">New AI Grading Assistant V2.0</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                        Checkmate: The LMS that <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-200">grades for you</span>
                    </h1>

                    <p className="text-lg text-text-secondary max-w-lg leading-relaxed">
                        Streamline your classroom management with intelligent automation. Focus on strategy and student success while we handle the tactics.
                    </p>


                    <div className="flex items-center gap-4 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-neutral-200 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-background bg-neutral-200 overflow-hidden">
                                <img src={`https://isb.nu.edu.pk/assets/img/person/6508_.webp`} alt="User" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="text-sm font-medium text-text-secondary">
                            Loved by teachers worldwide
                        </div>
                    </div>
                </div>

                {/* Right Content - Abstract Graphic/Mockup */}
                <div className="relative isolate"> {/* Added isolate to manage stacking contexts */}
                    {/* Main Card */}
                    <div className="relative z-10 bg-background rounded-3xl shadow-2xl p-8 border border-neutral-100 max-w-md mx-auto lg:mx-0 lg:ml-auto">
                        <div className="absolute top-0 right-0 p-6">
                            <span className="text-accent font-bold text-sm">+12%</span>
                        </div>
                        <div className="mb-8">
                            <h3 className="text-text-muted text-sm font-medium mb-1">Grade Dist.</h3>
                            <div className="h-40 flex items-end gap-3 mt-4">
                                <div className="w-1/4 bg-accent-100 rounded-t-lg h-[40%]"></div>
                                <div className="w-1/4 bg-accent-200 rounded-t-lg h-[60%]"></div>
                                <div className="w-1/4 bg-accent-400 rounded-t-lg h-[80%]"></div>
                                <div className="w-1/4 bg-accent-500 rounded-t-lg h-[50%]"></div>
                            </div>
                        </div>

                        {/* Floating Element 1 (Engagement) - Kept inside or moved out depending on preference, kept inside matches your previous code */}
                        <div className="absolute -left-12 bottom-12 bg-background p-4 rounded-2xl shadow-xl border border-neutral-50 w-48 hidden md:block">
                            <h4 className="text-xs text-text-muted mb-2">Engagement</h4>
                            <div className="h-12 w-full">
                                <svg viewBox="0 0 100 40" className="w-full h-full stroke-accent-400 fill-none stroke-2">
                                    <path d="M0 35 Q 20 35, 40 15 T 80 20 T 100 5" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* --- MOVED OUTSIDE THE CARD --- */}
                    {/* Floating Element 2 - Knight Piece Abstract */}
                    {/* Increased size to w-56/64 and removed opacity to match the bold mockup */}
                    <div className="absolute -right-8 bottom-0 w-48 h-48 md:w-64 md:h-64 z-0 pointer-events-none text-text-primary">
                        <svg
                            viewBox="0 0 24 24"
                            className="w-full h-full drop-shadow-2xl fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M19,22H5V20H19V22M13,2V2C11.75,2 10.58,2.62 9.89,3.66L7,8L9,10L11.06,8.63C11.5,8.32 12.11,8.44 12.42,8.88C12.45,8.92 12.47,8.97 12.5,9.03V13H15V9C15,7.34 13.66,6 12,6V6C12,5.45 12.45,5 13,5H16V3H13V2M19,19H5V17C5,14.62 13.31,13.25 14.5,13.25C15.69,13.25 19,14.22 19,17V19Z" />
                        </svg>
                    </div>

                    {/* Secondary Card (Completion) */}
                    <div className="absolute top-12 -right-4 md:-right-12 bg-background p-4 rounded-2xl shadow-lg border border-neutral-50 w-40 z-20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-text-muted">Completion</span>
                        </div>
                        <div className="text-2xl font-bold text-text-primary mb-1">94%</div>
                        <div className="w-full bg-neutral-100 rounded-full h-1.5">
                            <div className="bg-gradient-to-r from-accent-400 to-success h-1.5 rounded-full w-[94%]"></div>
                        </div>
                    </div>

                    {/* Glow Effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent-400/10 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
                </div>

            </main>            {/* Trusted By Section */}
            <section className="bg-background-secondary py-12 border-t border-neutral-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-xs font-bold text-text-muted tracking-widest uppercase mb-8">Trusted by top educational institutions</p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-3 font-bold text-xl text-text-secondary">
                            <img src={fastLogo} alt="FAST NUCES" className="w-8 h-8 object-contain grayscale" />
                            National University of Computer and Emerging Sciences
                        </div>
                    </div>
                </div>
            </section>            {/* Features Section */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold mb-4 text-text-primary">Everything you need to master your classroom</h2>
                    <p className="text-text-secondary">Powerful features designed to save you time and improve student outcomes.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Smart Feedback",
                            desc: "Instant grading and personalized feedback loops powered by our advanced AI engine. Save hours every week.",
                            icon: (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M3.337 19.175l.707-.707M19.956 19.175l-.707-.707M7.636 5.636l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                </svg>
                            )
                        },
                        {
                            title: "Automated Grading",
                            desc: "Effortless grade exams using AI. Give it instructions once and let it handle the rest.",
                            icon: (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            )
                        },
                        {
                            title: "Plagiarism Detection",
                            desc: "Ensure academic integrity with rigorous AI-powered scanning that checks against billions of sources.",
                            icon: (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            )
                        }
                    ].map((feature, i) => (
                        <div key={i} className="p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow bg-background">
                            <div className="w-12 h-12 bg-primary text-text-inverse rounded-xl flex items-center justify-center mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-text-primary">{feature.title}</h3>
                            <p className="text-text-secondary leading-relaxed text-sm">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>            {/* Dashboard Preview Section */}
            <section className="py-24 bg-background overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-text-primary">
                            A dashboard built for <br />
                            <span className="text-accent-400">clarity and speed</span>
                        </h2>
                        <p className="text-text-secondary mb-8 max-w-md leading-relaxed">
                            Get a bird's eye view of your entire class performance. Identify at-risk students early and intervene effectively with data-backed decisions.
                        </p>

                        <ul className="space-y-4 mb-8">
                            {[
                                "Student progress tracking",
                                "Topic Wise Grading Reports",
                                "Identify key areas for improvement"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-text-secondary font-medium">
                                    <div className="w-5 h-5 rounded-full bg-primary text-text-inverse flex items-center justify-center flex-shrink-0">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                    </div>

                    <div className="relative">
                        {/* Mockup Container */}
                        <div className="bg-neutral-900 rounded-3xl p-2 shadow-2xl">
                            <div className="bg-accent-50 rounded-2xl overflow-hidden aspect-[4/3] relative">
                                {/* Mockup Header */}
                                <div className="bg-background px-4 py-3 border-b border-neutral-100 flex items-center gap-4">
                                    <div className="w-8 h-8 bg-accent-400 rounded-lg"></div>
                                    <div className="text-sm font-bold text-neutral-800">Dashboard Overview</div>
                                    <div className="ml-auto w-8 h-8 rounded-full bg-neutral-100"></div>
                                </div>
                                {/* Mockup Sidebar */}
                                <div className="absolute left-0 top-14 bottom-0 w-16 bg-background border-r border-neutral-100 flex flex-col items-center py-4 gap-6 text-text-muted">
                                    <div className="w-6 h-6 bg-neutral-200 rounded"></div>
                                    <div className="w-6 h-6 bg-neutral-200 rounded"></div>
                                    <div className="w-6 h-6 bg-neutral-200 rounded"></div>
                                    <div className="w-6 h-6 bg-neutral-200 rounded"></div>
                                </div>
                                {/* Mockup Content */}
                                <div className="ml-16 p-6 grid grid-cols-2 gap-6 h-full">
                                    <div className="bg-background p-4 rounded-xl shadow-sm">
                                        <div className="w-1/2 h-4 bg-neutral-100 rounded mb-8"></div>
                                        <div className="flex items-end gap-3 h-32">
                                            <div className="w-1/4 bg-neutral-800 h-[60%] rounded-t"></div>
                                            <div className="w-1/4 bg-primary h-[80%] rounded-t"></div>
                                            <div className="w-1/4 bg-accent-400 h-[40%] rounded-t"></div>
                                            <div className="w-1/4 bg-neutral-600 h-[70%] rounded-t"></div>
                                        </div>
                                    </div>
                                    <div className="bg-background p-4 rounded-xl shadow-sm space-y-3">
                                        <div className="w-1/3 h-4 bg-neutral-100 rounded mb-4"></div>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-success' : i === 2 ? 'bg-success' : 'bg-error'}`}></div>
                                                <div className="flex-1 h-8 bg-neutral-50 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>            {/* CTA Section */}
            <section className="bg-background-dark py-24 text-center px-6">
                <h2 className="text-3xl md:text-5xl font-bold text-text-inverse mb-6">Ready to transform your classroom?</h2>
                <p className="text-text-muted max-w-2xl mx-auto mb-10 text-lg">
                    Join thousands of educators who are already using Checkmate to teach smarter, not harder.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button className="bg-accent text-primary px-8 py-3.5 rounded-full font-bold hover:bg-accent-300 transition-colors w-full sm:w-auto">
                        Login
                    </button>
                </div>
            </section>            {/* Footer */}
            <footer className="bg-background pt-20 pb-12 border-t border-neutral-100">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                                <img src={logo} alt="Checkmate Logo" className="h-auto w-auto" />
                            </div>
                            <span className="text-lg font-bold">Checkmate</span>
                        </div>
                        <p className="text-text-muted text-sm leading-relaxed mb-6">
                            Empowering educators with AI-driven tools for the modern classroom.
                        </p>
                    </div>

                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

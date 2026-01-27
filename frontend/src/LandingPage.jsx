import logo from './logo.png';

const LandingPage = () => {
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
                    <a href="#" className="hover:text-text-primary transition-colors">Product</a>
                    <a href="#" className="hover:text-text-primary transition-colors">Solutions</a>
                    <a href="#" className="hover:text-text-primary transition-colors">Pricing</a>
                    <a href="#" className="hover:text-text-primary transition-colors">Resources</a>
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-sm font-medium hover:text-text-primary transition-colors">Log In</button>
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

                    <div className="flex flex-wrap items-center gap-4">
                        <button className="bg-primary text-text-inverse px-8 py-4 rounded-full text-base font-semibold hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl">
                            Get Started for Free
                        </button>
                        <button className="bg-background text-text-primary border border-neutral-200 px-8 py-4 rounded-full text-base font-semibold hover:bg-neutral-50 transition-all flex items-center gap-2 shadow-sm">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Watch Demo
                        </button>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-neutral-200 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                            ))}
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
                        {/* Logo Placeholders */}
                        {['Univ. of Tech', 'State College', 'Ivy Academy', 'Science Inst.'].map((name) => (
                            <div key={name} className="flex items-center gap-2 font-bold text-xl text-text-secondary">
                                <div className="w-6 h-6 bg-text-muted rounded-sm"></div>
                                {name}
                            </div>
                        ))}
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
                            title: "Smart Assessments",
                            desc: "Instant grading and personalized feedback loops powered by our advanced AI engine. Save hours every week.",
                            icon: (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M3.337 19.175l.707-.707M19.956 19.175l-.707-.707M7.636 5.636l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                </svg>
                            )
                        },
                        {
                            title: "Automated Attendance",
                            desc: "Effortless tracking integrated with your daily workflow. Set it once and let the system handle the rest.",
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
                                "Real-time student progress tracking",
                                "Customizable gradebook views",
                                "One-click report generation"
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

                        <a href="#" className="inline-flex items-center gap-2 font-bold text-text-primary hover:gap-3 transition-all">
                            Explore all features
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </a>
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
                        Start Free Trial
                    </button>
                    <button className="text-text-inverse border border-neutral-700 px-8 py-3.5 rounded-full font-bold hover:bg-neutral-900 transition-colors w-full sm:w-auto">
                        Schedule Demo
                    </button>
                </div>
            </section>            {/* Footer */}
            <footer className="bg-background pt-20 pb-12 border-t border-neutral-100">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-text-inverse" stroke="currentColor" strokeWidth="3">
                                    <path d="M5 12l5 5L20 7" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold">Checkmate</span>
                        </div>
                        <p className="text-text-muted text-sm leading-relaxed mb-6">
                            Empowering educators with AI-driven tools for the modern classroom.
                        </p>
                        <div className="flex gap-4 text-text-muted">
                            <a href="#" className="hover:text-text-primary"><svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg></a>
                            <a href="#" className="hover:text-text-primary"><svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-text-muted">
                            <li><a href="#" className="hover:text-text-primary">Features</a></li>
                            <li><a href="#" className="hover:text-text-primary">Integrations</a></li>
                            <li><a href="#" className="hover:text-text-primary">Pricing</a></li>
                            <li><a href="#" className="hover:text-text-primary">Roadmap</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Resources</h4>
                        <ul className="space-y-4 text-sm text-text-muted">
                            <li><a href="#" className="hover:text-text-primary">Blog</a></li>
                            <li><a href="#" className="hover:text-text-primary">Case Studies</a></li>
                            <li><a href="#" className="hover:text-text-primary">Help Center</a></li>
                            <li><a href="#" className="hover:text-text-primary">Community</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Company</h4>
                        <ul className="space-y-4 text-sm text-text-muted">
                            <li><a href="#" className="hover:text-text-primary">About Us</a></li>
                            <li><a href="#" className="hover:text-text-primary">Careers</a></li>
                            <li><a href="#" className="hover:text-text-primary">Contact Us</a></li>
                            <li><a href="#" className="hover:text-text-primary">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

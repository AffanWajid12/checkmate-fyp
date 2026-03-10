import { motion } from "motion/react"

export default function HeroSection() {

    return <motion.div
        initial={{ opacity: 0, y: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} // Ensures it only animates the first time you scroll down
        transition={{ duration: 0.7 }}
    >
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

        </main>
    </motion.div>
}
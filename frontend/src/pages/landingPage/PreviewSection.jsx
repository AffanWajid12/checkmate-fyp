import { motion } from "motion/react"

export default function FeaturesSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} // Ensures it only animates the first time you scroll down
            transition={{ duration: 1.1 }}
        >
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
            </section>
        </motion.div>
    )
}
import { motion } from "motion/react"

export default function FeaturesSection() {

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} // Ensures it only animates the first time you scroll down
            transition={{ duration: 1.1 }}
        >
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
                        <div key={i} className="p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow bg-background duration-500">
                            <div className="w-12 h-12 bg-primary text-text-inverse rounded-xl flex items-center justify-center mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-text-primary">{feature.title}</h3>
                            <p className="text-text-secondary leading-relaxed text-sm">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </motion.div>)
}
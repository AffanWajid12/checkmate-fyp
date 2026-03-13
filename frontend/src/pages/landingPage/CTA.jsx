import { motion } from "motion/react"

export default function CTA() {
    return (

        <section className="bg-background-dark py-24 text-center px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} // Ensures it only animates the first time you scroll down
                transition={{ duration: 1.1 }}
            >
                <h2 className="text-3xl md:text-5xl font-bold text-text-inverse mb-6">Ready to transform your classroom?</h2>
                <p className="text-text-muted max-w-2xl mx-auto mb-10 text-lg">
                    Join thousands of educators who are already using Checkmate to teach smarter, not harder.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div onClick={() => window.location.href = "/login"} className="bg-accent text-primary px-8 py-3.5 rounded-full font-bold hover:bg-accent-300 transition-colors w-full sm:w-auto cursor-pointer">
                        Login
                    </div>
                </div>
            </motion.div>
        </section >

    )
}
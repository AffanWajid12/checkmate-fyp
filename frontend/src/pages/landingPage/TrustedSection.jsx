import { motion } from "motion/react"
import fastLogo from '../../Fast_Logo.png';

export default function TrustedSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} // Ensures it only animates the first time you scroll down
            transition={{ duration: 1.1 }}
        >
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
            </section>
        </motion.div >
    )
}
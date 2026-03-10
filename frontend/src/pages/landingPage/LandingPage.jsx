import { useNavigate } from 'react-router-dom';
import logo from '../../logo.png';

import { motion } from "motion/react"
import HeroSection from './HeroSection.jsx'
import TrustedSection from './TrustedSection.jsx'
import FeaturesSection from './FeaturesSection.jsx'
import PreviewSection from './PreviewSection.jsx'
import CTA from './CTA.jsx'
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
                    <a href="/login" className="bg-primary text-text-inverse px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors">Log In</a>

                </div>
            </nav>

            {/* Hero Section */}
            <HeroSection />
            {/* Trusted By Section */}
            <TrustedSection />
            {/* Features Section */}
            <FeaturesSection />
            {/* Dashboard Preview Section */}

            <PreviewSection />
            {/* CTA Section */}
            <CTA />
            {/* Footer */}

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

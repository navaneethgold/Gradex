import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Sparkles,
    BrainCircuit,
    Zap,
    BarChart3,
    BookOpen,
    ArrowRight,
    Upload,
    CheckCircle2
} from 'lucide-react';
import '../Styles/LandingPage.css';
import Footer from './Footer';

const LandingPage = () => {
    const navigate = useNavigate();

    // Animation Variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="landing-container">
            {/* Navbar */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="landing-nav"
            >
                <div className="nav-brand">GradeX</div>
                <div className="nav-links">
                    <button onClick={() => navigate('/login')} className="nav-btn login">Sign In</button>
                    <button onClick={() => navigate('/signUp')} className="nav-btn cta">Get Started</button>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg-blob blob-1"></div>
                <div className="hero-bg-blob blob-2"></div>

                <div className="hero-content">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="hero-text"
                    >
                        <motion.div variants={fadeInUp} className="section-badge">
                            <Sparkles size={16} style={{ display: 'inline', marginRight: '5px' }} />
                            AI-Powered Education
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="hero-title">
                            Smart Quizzes,<br />
                            <span>Instant Grades.</span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="hero-desc">
                            GradeX transforms your study materials into interactive quizzes in seconds.
                            Upload PDFs, challenge peers, and track your growth with advanced analytics.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="hero-buttons">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/signUp')}
                                className="hero-btn primary"
                            >
                                Start Learning <ArrowRight size={20} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                                className="hero-btn secondary"
                            >
                                How it Works
                            </motion.button>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="hero-visual"
                    >
                        <img
                            src="/login-bg3.png"
                            alt="GradeX AI"
                            style={{ width: '100%', maxWidth: '600px', objectFit: 'contain', borderRadius: '2rem' }}
                        />

                        {/* Floating Elements */}
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="floating-card"
                            style={{ top: '10%', right: '10%' }}
                        >
                            <Zap size={32} color="#F59E0B" fill="#F59E0B" />
                            <div style={{ fontWeight: 'bold', marginTop: '5px' }}>Fast Gen</div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 15, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                            className="floating-card"
                            style={{ bottom: '15%', left: '10%' }}
                        >
                            <Checks />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="section-header"
                >
                    <div className="section-badge">Workflow</div>
                    <h2 className="section-title">How GradeX Works</h2>
                    <p className="section-desc">From PDF to personalized exam in four simple steps.</p>
                </motion.div>

                <motion.div
                    className="features-grid"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={fadeInUp}
                            className="feature-card"
                        >
                            <div className="icon-box">{feature.icon}</div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-desc">{feature.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Tech Stack / About */}
            <section className="stats-section">
                <div className="stats-grid">
                    <StatItem number="MERN" label="Full Stack" />
                    <StatItem number="AI" label="Gemini Powered" />
                    <StatItem number="Vector" label="RAG Embeddings" />
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

// Helper Components
const StatItem = ({ number, label }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="stat-item"
    >
        <h3>{number}</h3>
        <p>{label}</p>
    </motion.div>
);

const Checks = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CheckCircle2 size={24} color="#10B981" />
        <div>
            <div style={{ fontWeight: 'bold' }}>98% Accuracy</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>AI Grading</div>
        </div>
    </div>
);

const features = [
    {
        icon: <BookOpen size={28} />,
        title: "1. Create Group",
        desc: "Organize your study sessions by creating distinct groups for each subject or class."
    },
    {
        icon: <Upload size={28} />,
        title: "2. Upload Material",
        desc: "Drag and drop your PDF study materials. Our vector database indexes them instantly."
    },
    {
        icon: <BrainCircuit size={28} />,
        title: "3. AI Generation",
        desc: "Gemini AI analyzes the content and creates challenging questions tailored to your material."
    },
    {
        icon: <BarChart3 size={28} />,
        title: "4. Detailed Analytics",
        desc: "Get instant feedback, performance breakdown, and global leaderboard rankings."
    }
];

export default LandingPage;

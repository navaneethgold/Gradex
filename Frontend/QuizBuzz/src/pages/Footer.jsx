import React from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import '../Styles/Footer.css';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-content">
                <div className="footer-brand">
                    <span className="brand-text">GradeX</span>
                    <p className="brand-sub">
                        Empowering students and educators with AI-driven assessments and analytics.
                        Smart grading for a smarter future.
                    </p>
                </div>

                <div className="footer-links-group">
                    <div className="footer-column">
                        <h4>Platform</h4>
                        <ul>
                            <li><a href="/home">Dashboard</a></li>
                            <li><a href="/create-exam">Create Exam</a></li>
                            <li><a href="/groups">Classes</a></li>
                            <li><a href="/profile">Profile</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4>Resources</h4>
                        <ul>
                            <li><a href="#">Documentation</a></li>
                            <li><a href="#">API Reference</a></li>
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">Community</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4>Company</h4>
                        <ul>
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© 2026 GradeX Inc. All rights reserved.</p>
                <div className="social-links">
                    <a href="https://github.com/navaneethgold/Gradex" target="_blank" rel="noopener noreferrer">
                        <Github className="social-icon" size={20} />
                    </a>
                    <a href="https://x.com/Navaneeth1729" target="_blank" rel="noopener noreferrer">
                        <Twitter className="social-icon" size={20} />
                    </a>
                    <a href="https://linkedin.com/in/navaneeth-adharapuram-190686278" target="_blank" rel="noopener noreferrer">
                        <Linkedin className="social-icon" size={20} />
                    </a>
                    <a href="mailto:navaneethabs.2006@gmail.com">
                        <Mail className="social-icon" size={20} />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

import { Link } from 'react-router-dom';

function LandingPage() {
    return (
        <div className="dark-theme">
            <nav className="navbar">
                <div className="logo">Ambali<span className="dot">.</span></div>
                <ul className="nav-links">
                    <li><a href="#about">Tentang Kami</a></li>
                    <li><a href="#programs">Program</a></li>
                    <li><Link to="/creators" className="btn-premium">Edukslusif (Kreator)</Link></li>
                </ul>
            </nav>

            <header className="hero">
                <div className="hero-content">
                    <h1 className="fade-up visible">Kesetaraan. <br /><span className="gradient-text">Pemberdayaan.</span> Harapan.</h1>
                    <p className="fade-up delay-1 visible">Yayasan Ambali hadir untuk memberikan perlindungan dan dukungan tanpa batas bagi kaum tunawisma serta komunitas kulit hitam yang berjuang melawan diskriminasi.</p>
                    <div className="hero-buttons fade-up delay-2 visible">
                        <a href="#about" className="btn-primary">Misi Kami</a>
                        <Link to="/creators" className="btn-secondary">Platform Edukasi Eksklusif</Link>
                    </div>
                </div>
            </header>

            <section id="about" className="section glass-section">
                <div className="container container-grid">
                    <div className="text-content reveal">
                        <h2>Berdiri Bersama, <span className="highlight">Melawan Diskriminasi</span></h2>
                        <p>Diskriminasi dan ketidaksetaraan telah meminggirkan banyak saudara kita. Kami menyediakan tempat berlindung, bantuan kebutuhan dasar, kesehatan mental, hingga pelatihan vokasi bagi mereka yang paling membutuhkan.</p>
                    </div>
                    <div className="stats reveal">
                        <div className="stat-card">
                            <h3 className="counter" data-target="5000">5000+</h3>
                            <p>Tunawisma Terbantu</p>
                        </div>
                        <div className="stat-card">
                            <h3 className="counter" data-target="1200">1200+</h3>
                            <p>Kreator Edukslusif</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="container text-center">
                    <h2 className="logo-footer">Ambali<span className="dot">.</span></h2>
                    <p>&copy; 2026 Yayasan Ambali. Hak Cipta Dilindungi.</p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CreatorsPage from './pages/CreatorsPage';
import TopUpPage from './pages/TopUpPage';
import StudioPage from './pages/StudioPage';
import AdminPage from './pages/AdminPage';
import TrendingPage from './pages/TrendingPage';
import LivePage from './pages/LivePage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const handleScroll = () => {
      const revealElements = document.querySelectorAll(".reveal");
      const windowHeight = window.innerHeight;
      const revealPoint = 150;
      revealElements.forEach(el => {
        const revealTop = el.getBoundingClientRect().top;
        if (revealTop < windowHeight - revealPoint) {
          el.classList.add("fade-up", "visible");
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/creators" element={<CreatorsPage />} />
        <Route path="/topup" element={<TopUpPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;

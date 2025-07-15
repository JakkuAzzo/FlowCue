import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingController, setLoadingController] = useState(false);
  const [loadingPerformer, setLoadingPerformer] = useState(false);
  const [loadingAudience, setLoadingAudience] = useState(false);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const openInNewWindow = (path) => {
    window.open(path, '_blank', 'toolbar=no,menubar=no,location=no,status=no');
  };

  const goToScreen = async (path, setLoadingState) => {
    setLoadingState(true);
    // Add a small delay to show loading state
    setTimeout(() => {
      navigate(path);
      setLoadingState(false);
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-icon">
            🎵
          </div>
          <h2 className="loading-title">Initializing FlowCue Live...</h2>
          <p className="loading-subtitle">Preparing your FlowCue experience</p>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Animated Background Effects */}
      <div className="bg-effects">
        <div className="bg-effect bg-effect-1"></div>
        <div className="bg-effect bg-effect-2"></div>
        <div className="bg-effect bg-effect-3"></div>
      </div>

      {/* Navigation Header */}
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="nav-logo-icon">F</div>
            <h1 className="nav-title">FlowCue Live</h1>
          </div>
          <div>
            <button
              onClick={() => goToScreen('/controller', setLoadingController)}
              className="btn btn-primary btn-sm"
              disabled={loadingController}
            >
              {loadingController ? '🔄' : '🚀'} Quick Start
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Animated Title */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 className="hero-title gradient-text">
              FlowCue Live
            </h1>
            <div style={{ width: '8rem', height: '0.25rem', background: 'linear-gradient(135deg, #60a5fa, #a855f7)', margin: '0 auto', borderRadius: '9999px' }}></div>
          </div>

          <p className="hero-subtitle">
            The ultimate web-based performance controller for worship leaders, musicians, and presenters.
            <br />
            <span style={{ color: '#60a5fa', fontWeight: '600' }}>Navigate lyrics, slides, and songs</span> using gestures, voice commands, or manual controls.
          </p>
          
          {/* Quick Action Buttons */}
          <div className="hero-buttons">
            <button
              onClick={() => goToScreen('/controller', setLoadingController)}
              className="btn btn-primary btn-lg"
              disabled={loadingController}
            >
              {loadingController ? '🔄' : '🎛️'} Start Controller
            </button>
            <button
              onClick={() => goToScreen('/performer', setLoadingPerformer)}
              className="btn btn-success btn-lg"
              disabled={loadingPerformer}
            >
              {loadingPerformer ? '🔄' : '🎤'} Performer Mode
            </button>
            <button
              onClick={() => goToScreen('/audience', setLoadingAudience)}
              className="btn btn-danger btn-lg"
              disabled={loadingAudience}
            >
              {loadingAudience ? '🔄' : '📺'} Audience Display
            </button>
          </div>

          {/* Feature Badges */}
          <div className="hero-badges">
            <span className="badge">✨ Gesture Control</span>
            <span className="badge">🎙️ Voice Commands</span>
            <span className="badge">🔄 Real-time Sync</span>
            <span className="badge">📱 Multi-device</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="cards-grid">
        {/* Controller Interface Card */}
        <div className="card">
          <div className="card-icon card-icon-blue">🎛️</div>
          <h3 className="card-title">Controller Interface</h3>
          <div className="card-features">
            <div className="feature-item">
              <span className="feature-check feature-check-blue">✓</span>
              <span>Manage song schedules and setlists</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-blue">✓</span>
              <span>Customize lyric backgrounds & media</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-blue">✓</span>
              <span>Control all performer & audience displays</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-blue">✓</span>
              <span>Record and manage custom gestures</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-blue">✓</span>
              <span>Search and download lyrics</span>
            </div>
          </div>
          <div className="card-buttons">
            <button
              onClick={() => goToScreen('/controller', setLoadingController)}
              className="btn btn-primary"
              disabled={loadingController}
            >
              {loadingController ? '🔄 Loading...' : 'Open Controller'}
            </button>
            <button
              onClick={() => openInNewWindow('/controller')}
              className="btn btn-secondary btn-sm"
            >
              🔗 Open in New Window
            </button>
          </div>
        </div>

        {/* Performer Screen Card */}
        <div className="card">
          <div className="card-icon card-icon-green">🎤</div>
          <h3 className="card-title">Performer Screen</h3>
          <div className="card-features">
            <div className="feature-item">
              <span className="feature-check feature-check-green">✓</span>
              <span>Large current lyrics display</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-green">✓</span>
              <span>Webcam with gesture tracking overlay</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-green">✓</span>
              <span>Upcoming lyrics preview</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-green">✓</span>
              <span>Hand gesture & voice recognition</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-green">✓</span>
              <span>Real-time sync with audience display</span>
            </div>
          </div>
          <div className="card-buttons">
            <button
              onClick={() => goToScreen('/performer', setLoadingPerformer)}
              className="btn btn-success"
              disabled={loadingPerformer}
            >
              {loadingPerformer ? '🔄 Loading...' : 'Open Performer'}
            </button>
            <button
              onClick={() => openInNewWindow('/performer')}
              className="btn btn-secondary btn-sm"
            >
              🔗 Open in New Window
            </button>
          </div>
        </div>

        {/* Audience Display Card */}
        <div className="card">
          <div className="card-icon card-icon-purple">📺</div>
          <h3 className="card-title">Audience Display</h3>
          <div className="card-features">
            <div className="feature-item">
              <span className="feature-check feature-check-purple">✓</span>
              <span>Full-screen lyrics with large fonts</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-purple">✓</span>
              <span>Dynamic background media support</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-purple">✓</span>
              <span>Auto text contrast adjustment</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-purple">✓</span>
              <span>Smooth transitions & animations</span>
            </div>
            <div className="feature-item">
              <span className="feature-check feature-check-purple">✓</span>
              <span>Multi-screen casting capability</span>
            </div>
          </div>
          <div className="card-buttons">
            <button
              onClick={() => goToScreen('/audience', setLoadingAudience)}
              className="btn btn-danger"
              disabled={loadingAudience}
            >
              {loadingAudience ? '🔄 Loading...' : 'Open Audience Display'}
            </button>
            <button
              onClick={() => openInNewWindow('/audience')}
              className="btn btn-secondary btn-sm"
            >
              🔗 Open in New Window
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Setup Guide */}
      <div className="setup-guide">
        <div className="setup-card">
          <h3 className="setup-title">Quick Setup Guide</h3>
          <div className="setup-grid">
            <div className="setup-section">
              <h4 className="setup-section-title" style={{ color: '#60a5fa' }}>
                <span className="setup-number setup-number-blue">1</span>
                For Worship Leaders
              </h4>
              <div className="setup-steps">
                <div className="setup-step">
                  <span className="setup-step-icon" style={{ color: '#60a5fa' }}>🎛️</span>
                  <span>Open <strong>Controller Interface</strong> on your main device</span>
                </div>
                <div className="setup-step">
                  <span className="setup-step-icon" style={{ color: '#34d399' }}>🎤</span>
                  <span>Open <strong>Performer Screen</strong> on a secondary device/monitor</span>
                </div>
                <div className="setup-step">
                  <span className="setup-step-icon" style={{ color: '#a78bfa' }}>📺</span>
                  <span>Cast or open <strong>Audience Display</strong> on projection screens</span>
                </div>
                <div className="setup-step">
                  <span className="setup-step-icon" style={{ color: '#fbbf24' }}>📹</span>
                  <span>Enable webcam and gesture recognition on Performer Screen</span>
                </div>
                <div className="setup-step">
                  <span className="setup-step-icon" style={{ color: '#f472b6' }}>👋</span>
                  <span>Use hand gestures or voice commands to navigate</span>
                </div>
              </div>
            </div>
            <div className="setup-section">
              <h4 className="setup-section-title" style={{ color: '#34d399' }}>
                <span className="setup-number setup-number-green">2</span>
                Key Features
              </h4>
              <div className="setup-steps">
                <div className="setup-step">
                  <span className="setup-step-icon" style={{ color: '#34d399' }}>⚡</span>
                  <span><strong>Real-time sync</strong> across all devices</span>
                </div>
                <div className="setup-step">
                  <span className="setup-step-icon" style={{ color: '#60a5fa' }}>👋</span>
                  <span><strong>Gesture control:</strong> next/previous slides</span>
                </div>
                <div className="setup-step">
                  <span className="setup-step-icon" style={{ color: '#a78bfa' }}>🎤</span>
                  <span><strong>Voice commands:</strong> "next slide", "previous"</span>
                </div>
                <div className="setup-step">
                  <span className="setup-step-icon" style={{ color: '#fbbf24' }}>🎨</span>
                  <span><strong>Dynamic backgrounds</strong> with auto-contrast</span>
                </div>
                <div className="setup-step">
                  <span className="setup-step-icon" style={{ color: '#f472b6' }}>🎵</span>
                  <span><strong>Song detection</strong> and auto-advance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-logo">
          <div className="footer-logo-icon">F</div>
          <p className="footer-text" style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            FlowCue Live
          </p>
        </div>
        <p className="footer-text">
          Seamless worship and presentation control
        </p>
        <p className="footer-subtitle">
          Built with ❤️ for worship leaders and presenters worldwide
        </p>
      </div>
    </div>
  );
}

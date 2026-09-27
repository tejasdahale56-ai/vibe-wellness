const signals = [
  { label: "Sleep", value: "7h 42m", note: "A little more rest", icon: "☾", tone: "lavender" },
  { label: "Movement", value: "8,240", note: "Steps so far today", icon: "↗", tone: "peach" },
  { label: "Mood", value: "Steady", note: "You’re finding your rhythm", icon: "✳", tone: "mint" },
];

export default function Home() {
  return (
    <main className="page-shell">
      <nav className="nav wrap" aria-label="Main navigation">
        <a className="brand" href="#home" aria-label="VIBE home"><span className="brand-mark">v</span>vibe<span className="brand-period">.</span></a>
        <div className="nav-links"><a href="#how-it-works">How it works</a><a href="#why-vibe">Our approach</a></div>
        <a className="nav-cta" href="#get-started">Get started <span aria-hidden="true">↗</span></a>
      </nav>

      <section className="hero wrap" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR WELLNESS, IN A NEW LIGHT</div>
          <h1>Feel more<br />like <em>you.</em></h1>
          <p className="hero-description">Wellbeing isn’t one-size-fits-all. VIBE helps you notice the little things, understand your patterns, and find what feels good for you.</p>
          <div className="hero-actions" id="get-started"><a className="button button-dark" href="mailto:hello@vibe.health">Find your rhythm <span aria-hidden="true">↗</span></a><span className="no-pressure">A gentler way to check in with yourself.</span></div>
          <div className="social-proof"><div className="avatars" aria-hidden="true"><span>J</span><span>M</span><span>A</span></div><p>Made for real life, <strong>not perfection.</strong></p></div>
        </div>

        <div className="hero-visual" aria-label="A preview of your personal wellness insights">
          <div className="sun-glow" />
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="sparkle sparkle-one">✳</div><div className="sparkle sparkle-two">✳</div>
          <article className="insight-card">
            <div className="card-topline"><div><span className="card-kicker">YOUR DAILY VIBE</span><p className="card-date">Tuesday, October 14</p></div><span className="more-button" aria-hidden="true">···</span></div>
            <div className="vibe-score"><div className="score-ring"><span>78</span><small>feeling good</small></div><div className="score-copy"><span className="score-label">TODAY’S OUTLOOK</span><strong>A little more<br />in balance.</strong><span className="score-note">Your steady sleep is showing up in your energy.</span></div></div>
            <div className="card-divider" />
            <div className="signals-heading"><span>A FEW THINGS WE NOTICED</span><span className="signals-date">TODAY</span></div>
            <div className="signal-list">{signals.map((signal) => <div className="signal" key={signal.label}><span className={`signal-icon ${signal.tone}`} aria-hidden="true">{signal.icon}</span><span className="signal-info"><strong>{signal.label}</strong><small>{signal.note}</small></span><span className="signal-value">{signal.value}</span></div>)}</div>
            <div className="card-foot"><span className="foot-sparkle">✦</span><span>Small steps count, too.</span><span className="foot-arrow">↗</span></div>
          </article>
          <div className="floating-note"><span className="note-icon">✿</span><span><strong>Your pace is the right pace.</strong><small>One day at a time</small></span></div>
          <span className="visual-caption">A clearer picture, at your pace.</span>
        </div>
      </section>

      <section className="bottom-strip wrap" id="how-it-works"><div className="strip-intro"><span className="strip-star">✳</span><p>Less pressure.<br /><strong>More understanding.</strong></p></div><div className="strip-item"><span>01</span><p><strong>Get curious</strong><small>Notice what your days are telling you.</small></p></div><div className="strip-item"><span>02</span><p><strong>Find your patterns</strong><small>See how the little things connect.</small></p></div><div className="strip-item"><span>03</span><p><strong>Choose what feels right</strong><small>Make wellbeing yours, one step at a time.</small></p></div></section>
      <footer className="footer wrap" id="why-vibe"><a className="brand footer-brand" href="#home"><span className="brand-mark">v</span>vibe<span className="brand-period">.</span></a><span>Wellness, on your wavelength.</span><span>© 2026 VIBE</span></footer>
    </main>
  );
}

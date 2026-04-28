export function AdminPage() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">Admin</div>
        <h1 className="page-title">Quality, control, and delivery operations.</h1>
        <p className="subtext">
          The operator console for source health, event review, prompt controls,
          and dispatch integrity.
        </p>
        <div className="toolbar">
          <span className="pill">Source health</span>
          <span className="metric-chip">Review queue</span>
          <span className="metric-chip">Dispatch logs</span>
        </div>
      </section>

      <section className="admin-grid">
        <article className="stat-card">
          <div className="eyebrow">Sources</div>
          <div className="stat-value">8</div>
          <div className="footnote">connected adapters</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Jobs</div>
          <div className="stat-value">3</div>
          <div className="footnote">active workflows</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Queue</div>
          <div className="stat-value">12</div>
          <div className="footnote">review items</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Prompts</div>
          <div className="stat-value">4</div>
          <div className="footnote">tracked versions</div>
        </article>
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Ops modules</div>
              <h3>Control surface</h3>
            </div>
          </div>
          <div className="admin-stack">
            <div className="admin-item">
              <strong>Source board</strong>
              <div className="footnote">timeouts, blocks, parse quality</div>
            </div>
            <div className="admin-item">
              <strong>Event review</strong>
              <div className="footnote">merge, split, approve, discard</div>
            </div>
            <div className="admin-item">
              <strong>Threshold controls</strong>
              <div className="footnote">weight and trust tuning</div>
            </div>
            <div className="admin-item">
              <strong>Dispatch logs</strong>
              <div className="footnote">delivery retries and failures</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Daily loop</div>
              <h3>Analyst workflow</h3>
            </div>
          </div>
          <div className="timeline">
            <div className="timeline-item">
              <strong>Review high-impact ambiguity</strong>
              <div className="footnote">manual attention first goes to uncertain top signals</div>
            </div>
            <div className="timeline-item">
              <strong>Audit source failures</strong>
              <div className="footnote">identify parser vs upstream issues</div>
            </div>
            <div className="timeline-item">
              <strong>Check feedback outcomes</strong>
              <div className="footnote">validate whether usefulness is improving</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

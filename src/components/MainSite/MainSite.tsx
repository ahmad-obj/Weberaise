import {
  engagementOptions,
  principles,
  processSteps,
  selectedWork,
  services,
} from '@/content/homepage';
import { FirstImpression } from './FirstImpression';

export function MainSite() {
  return (
    <main className="main-site" data-main-site>
      <FirstImpression />

      <section id="work" className="section-shell section-shell--dark">
        <header className="section-heading-row">
          <p className="section-kicker">02 / SELECTED WORK</p>
          <p className="section-note">Placeholder projects for layout and pacing only.</p>
        </header>
        <div className="work-stack">
          {selectedWork.map((project) => (
            <article className="work-project" key={project.index}>
              <div className="work-project__meta">
                <span>{project.index}</span><strong>{project.title}</strong><span>{project.discipline}</span>
              </div>
              <div className="work-project__placeholder">TODO / REAL PROJECT ARTWORK</div>
            </article>
          ))}
        </div>
      </section>

      <section id="services" className="section-shell section-shell--surface">
        <p className="section-kicker">03 / WHAT WE DO</p>
        <h2 className="section-display">One digital presence.<br />Built as a system.</h2>
        <div className="editorial-list">
          {services.map(([index, title, copy]) => (
            <article key={index}><span>{index}</span><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section id="audit" className="section-shell section-shell--dark">
        <p className="section-kicker">04 / WEBSITE AUDIT</p>
        <h2 className="section-display">What is your website saying about your business?</h2>
        <div className="todo-line">TODO / Connect real audit workflow. No fake submission behavior.</div>
      </section>

      <section id="about" className="section-shell section-shell--surface">
        <p className="section-kicker">05 / WHY WEBERAISE</p>
        <h2 className="section-display">We don’t build websites to fill space online.</h2>
        <p className="section-lede">We build them to make businesses easier to understand, easier to trust, and easier to contact.</p>
        <div className="editorial-list editorial-list--three">
          {principles.map(([index, title, copy]) => (
            <article key={index}><span>{index}</span><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section id="process" className="section-shell section-shell--dark">
        <p className="section-kicker">06 / HOW WE WORK</p>
        <h2 className="section-display">A clear path from first look to launch.</h2>
        <div className="editorial-list">
          {processSteps.map(([index, title, copy]) => (
            <article key={index}><span>{index}</span><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section id="proof" className="section-shell section-shell--surface">
        <p className="section-kicker">07 / PROOF</p>
        <h2 className="section-display">Proof belongs here when it is real.</h2>
        <p className="section-lede">TODO / Add measured performance, deliverable proof, and client outcomes only when verified.</p>
      </section>

      <section id="engagement" className="section-shell section-shell--dark">
        <p className="section-kicker">08 / ENGAGEMENT</p>
        <h2 className="section-display">Start where your business needs it.</h2>
        <div className="editorial-list">
          {engagementOptions.map(([index, title, copy]) => (
            <article key={index}><span>{index}</span><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section id="contact" className="section-shell section-shell--surface final-contact">
        <p className="section-kicker">09 / LET’S WORK</p>
        <h2>LET’S RAISE<br />YOUR PRESENCE.</h2>
        <p>TODO / Connect the real project intake flow and final contact details.</p>
      </section>
    </main>
  );
}

import { firstImpressionCopy } from '@/content/homepage';

export function FirstImpression() {
  return (
    <section id="first-impression" className="first-impression first-impression--black section-shell">
      <p className="section-kicker">01 / FIRST IMPRESSION</p>
      <div className="first-impression__body">
        <h2>{firstImpressionCopy.heading}</h2>
        <p>{firstImpressionCopy.close}</p>
      </div>
    </section>
  );
}

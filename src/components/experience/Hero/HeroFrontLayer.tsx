import { HeroTypography } from './HeroTypography';

export function HeroFrontLayer() {
  return (
    <div className="hero-layer hero-layer--front" data-hero-front>
      <div className="hero-composition">
        <HeroTypography />
        <div className="hero-brand-slot hero-brand-slot--empty" aria-hidden="true" />
      </div>
    </div>
  );
}

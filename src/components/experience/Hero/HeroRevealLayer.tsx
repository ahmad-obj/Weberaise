import Image from 'next/image';
import { HeroTypography } from './HeroTypography';

export function HeroRevealLayer() {
  return (
    <div className="hero-layer hero-layer--reveal" data-hero-reveal aria-hidden="true">
      <div className="hero-composition">
        <HeroTypography />
        <div className="hero-brand-slot">
          <Image
            src="/brand/weberaise-horizontal-on-dark.svg"
            alt=""
            width={1800}
            height={430}
            priority
            className="hero-brand-lockup"
          />
        </div>
      </div>
    </div>
  );
}

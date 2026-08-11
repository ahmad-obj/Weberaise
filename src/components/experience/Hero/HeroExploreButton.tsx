'use client';

export function HeroExploreButton({ onExplore, disabled = false }: { onExplore: () => void; disabled?: boolean }) {
  return (
    <button className="hero-explore" type="button" onClick={onExplore} disabled={disabled}>
      <span>EXPLORE</span>
      <span className="hero-explore__rule" aria-hidden="true" />
    </button>
  );
}

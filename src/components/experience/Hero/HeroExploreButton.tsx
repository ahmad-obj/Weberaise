'use client';

export function HeroExploreButton({ onExplore, disabled = false }: { onExplore: () => void; disabled?: boolean }) {
  return (
    <button className="hero-explore" type="button" onClick={onExplore} disabled={disabled}>
      <span className="hero-explore__label">EXPLORE</span>
      <span className="hero-explore__icon" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false">
          <path d="M4.5 6.25 8 9.75l3.5-3.5" />
        </svg>
      </span>
    </button>
  );
}

export type JourneyStopId = 'q1' | 'q2' | 'q3' | 'reassurance';

export type JourneyVisit = {
  id: JourneyStopId;
  side: 'left' | 'right';
  clearance: number;
  approachLead: number;
  bandBias: number;
};

export type JourneyRouteConfig = {
  edgeInset: number;
  openingLength: number;
  sampleSpacing: number;
  visits: readonly JourneyVisit[];
};

const DESKTOP_ROUTE: JourneyRouteConfig = {
  edgeInset: 28,
  openingLength: 112,
  sampleSpacing: 12,
  visits: [
    { id: 'q1', side: 'right', clearance: 96, approachLead: 150, bandBias: 0.006 },
    { id: 'q2', side: 'left', clearance: 108, approachLead: 170, bandBias: -0.004 },
    { id: 'q3', side: 'right', clearance: 96, approachLead: 160, bandBias: 0.004 },
    { id: 'reassurance', side: 'left', clearance: 88, approachLead: 190, bandBias: -0.006 },
  ],
};

const MOBILE_ROUTE: JourneyRouteConfig = {
  edgeInset: 14,
  openingLength: 84,
  sampleSpacing: 10,
  visits: [
    { id: 'q1', side: 'right', clearance: 40, approachLead: 110, bandBias: 0.004 },
    { id: 'q2', side: 'left', clearance: 44, approachLead: 118, bandBias: -0.004 },
    { id: 'q3', side: 'right', clearance: 40, approachLead: 114, bandBias: 0.003 },
    { id: 'reassurance', side: 'left', clearance: 36, approachLead: 132, bandBias: -0.004 },
  ],
};

export function getJourneyRoute(viewportWidth: number): JourneyRouteConfig {
  return viewportWidth <= 720 ? MOBILE_ROUTE : DESKTOP_ROUTE;
}

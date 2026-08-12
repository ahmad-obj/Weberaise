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
  sampleSpacing: number;
  opening: {
    lead: number;
    loopRadiusX: number;
    loopRadiusY: number;
    exitRun: number;
  };
  q1: {
    clearance: number;
    wrapScale: number;
  };
  q2: {
    bendWidth: number;
    bendBias: number;
  };
  q3: {
    glyphScaleX: number;
    glyphScaleY: number;
  };
  reassurance: JourneyVisit;
};

const DESKTOP_ROUTE: JourneyRouteConfig = {
  edgeInset: 28,
  sampleSpacing: 10,
  opening: {
    lead: 220,
    loopRadiusX: 88,
    loopRadiusY: 54,
    exitRun: 132,
  },
  q1: {
    clearance: 78,
    wrapScale: 1,
  },
  q2: {
    bendWidth: 460,
    bendBias: 0,
  },
  q3: {
    glyphScaleX: 1.22,
    glyphScaleY: 1.1,
  },
  reassurance: {
    id: 'reassurance',
    side: 'left',
    clearance: 88,
    approachLead: 190,
    bandBias: -0.006,
  },
};

const MOBILE_ROUTE: JourneyRouteConfig = {
  edgeInset: 14,
  sampleSpacing: 8,
  opening: {
    lead: 118,
    loopRadiusX: 54,
    loopRadiusY: 34,
    exitRun: 76,
  },
  q1: {
    clearance: 34,
    wrapScale: 0.88,
  },
  q2: {
    bendWidth: 188,
    bendBias: 0,
  },
  q3: {
    glyphScaleX: 1.18,
    glyphScaleY: 1.06,
  },
  reassurance: {
    id: 'reassurance',
    side: 'left',
    clearance: 36,
    approachLead: 132,
    bandBias: -0.004,
  },
};

export function getJourneyRoute(viewportWidth: number): JourneyRouteConfig {
  return viewportWidth <= 720 ? MOBILE_ROUTE : DESKTOP_ROUTE;
}

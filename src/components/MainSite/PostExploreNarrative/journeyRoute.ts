export type JourneyStopId = 'q1' | 'q2' | 'q3' | 'reassurance';

export type JourneyRouteConfig = {
  edgeInset: number;
  sampleSpacing: number;
  ribbonWidth: number;
  opening: { lead: number; loopRadiusX: number; loopRadiusY: number; exitRun: number };
  q1: { clearance: number; wrapScale: number };
  q2: { bendWidth: number; bendBias: number };
  q3: {
    glyphScaleX: number;
    glyphScaleY: number;
    offsetX?: number;
    offsetY?: number;
    approachClearance?: number;
  };
  reassurance: {
    paddingX: number;
    paddingY: number;
    skew: number;
    approachLead: number;
    bandBias: number;
    exitRun: number;
    taperLength: number;
  };
};

const DESKTOP_ROUTE: JourneyRouteConfig = {
  edgeInset: 28,
  sampleSpacing: 10,
  ribbonWidth: 5.2,
  opening: { lead: 220, loopRadiusX: 88, loopRadiusY: 54, exitRun: 132 },
  q1: { clearance: 78, wrapScale: 1 },
  q2: { bendWidth: 460, bendBias: 0 },
  q3: { glyphScaleX: 1.14, glyphScaleY: 1.08, offsetX: -0.03, offsetY: 0.02, approachClearance: 0.72 },
  reassurance: {
    paddingX: 82,
    paddingY: 54,
    skew: 0.115,
    approachLead: 190,
    bandBias: -0.006,
    exitRun: 72,
    taperLength: 168,
  },
};

const MOBILE_ROUTE: JourneyRouteConfig = {
  edgeInset: 14,
  sampleSpacing: 8,
  ribbonWidth: 3.9,
  opening: { lead: 118, loopRadiusX: 54, loopRadiusY: 34, exitRun: 76 },
  q1: { clearance: 34, wrapScale: 0.88 },
  q2: { bendWidth: 188, bendBias: 0 },
  q3: { glyphScaleX: 1.14, glyphScaleY: 1.08, offsetX: -0.03, offsetY: 0.02, approachClearance: 0.72 },
  reassurance: {
    paddingX: 30,
    paddingY: 34,
    skew: 0.1,
    approachLead: 132,
    bandBias: -0.004,
    exitRun: 52,
    taperLength: 118,
  },
};

export function getJourneyRoute(viewportWidth: number): JourneyRouteConfig {
  return viewportWidth <= 720 ? MOBILE_ROUTE : DESKTOP_ROUTE;
}

export type PostExploreRuntime = {
  buildJourneyPath: typeof import('./buildJourneyPath').buildJourneyPath;
  createRibbonController: typeof import('./ribbonController').createRibbonController;
  getJourneyRoute: typeof import('./journeyRoute').getJourneyRoute;
  revealJourneyStop: typeof import('./questionReveal').revealJourneyStop;
  ShutterText: typeof import('@/components/ui/shutter-text').default;
};

let runtimePromise: Promise<PostExploreRuntime> | null = null;

export function loadPostExploreRuntime(): Promise<PostExploreRuntime> {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import('./buildJourneyPath'),
      import('./ribbonController'),
      import('./journeyRoute'),
      import('./questionReveal'),
      import('@/components/ui/shutter-text'),
    ]).then(([pathModule, controllerModule, routeModule, revealModule, shutterModule]) => ({
      buildJourneyPath: pathModule.buildJourneyPath,
      createRibbonController: controllerModule.createRibbonController,
      getJourneyRoute: routeModule.getJourneyRoute,
      revealJourneyStop: revealModule.revealJourneyStop,
      ShutterText: shutterModule.default,
    }));
  }
  return runtimePromise;
}

export function preloadPostExploreRuntime(): void {
  void loadPostExploreRuntime();
}

export const homepageSections = [
  { id: 'first-impression', label: '01 / FIRST IMPRESSION' },
  { id: 'work', label: '02 / SELECTED WORK' },
  { id: 'services', label: '03 / WHAT WE DO' },
  { id: 'audit', label: '04 / WEBSITE AUDIT' },
  { id: 'about', label: '05 / WHY WEBERAISE' },
  { id: 'process', label: '06 / HOW WE WORK' },
  { id: 'proof', label: '07 / PROOF' },
  { id: 'engagement', label: '08 / ENGAGEMENT' },
  { id: 'contact', label: '09 / LET’S WORK' },
] as const;

export const firstImpressionCopy = {
  heading: 'Your work can be excellent. Your website can still make it look ordinary.',
  close: 'We close that gap.',
} as const;

export const selectedWork = [
  { index: '01', title: 'PROJECT ONE', discipline: 'WEB DESIGN / DEVELOPMENT' },
  { index: '02', title: 'PROJECT TWO', discipline: 'BRAND / DIGITAL PRESENCE' },
  { index: '03', title: 'PROJECT THREE', discipline: 'WEBSITE / SYSTEM' },
] as const;

export const services = [
  ['01', 'Presence', 'How your business looks and communicates online.'],
  ['02', 'Structure', 'How visitors understand and navigate your offer.'],
  ['03', 'Build', 'Fast, responsive, carefully engineered websites.'],
  ['04', 'Motion', 'Interaction that adds clarity and character.'],
  ['05', 'Growth', 'Clear paths from attention to trust to enquiry.'],
] as const;

export const principles = [
  ['01', 'Clarity', 'Visitors should understand you quickly.'],
  ['02', 'Credibility', 'Your website should reflect the quality of the business behind it.'],
  ['03', 'Conversion', 'Every page should lead somewhere useful.'],
] as const;

export const processSteps = [
  ['01', 'Inspect', 'Review the current website, brand presence, and customer path.'],
  ['02', 'Define', 'Set structure, priorities, pages, message, and visual direction.'],
  ['03', 'Design', 'Build the visual system and key responsive screens.'],
  ['04', 'Build', 'Develop, optimize, integrate, and test.'],
  ['05', 'Launch', 'Deploy, connect analytics, verify, and hand over.'],
] as const;

export const engagementOptions = [
  ['01', 'Launch', 'For businesses getting online properly for the first time.'],
  ['02', 'Upgrade', 'For websites that no longer represent the business well.'],
  ['03', 'Presence', 'Website, brand foundation, and digital setup.'],
  ['04', 'Care', 'Ongoing maintenance, updates, and improvements.'],
] as const;

export type Unit = "ppb" | "ppm" | "ppt" | "pCi/L" | "mg/L";

export type Exposure = "consumption" | "dermal" | "inhalation";

export type HealthGroupId = "cancer" | "liver" | "developmental" | "immune" | "genotoxic" | "other";

export type ContaminantResult = {
  name: string;
  cas?: string;
  value: number;
  unit: Unit;
  healthGuideline: number;
  healthGuidelineSource: string;
  mcl?: number | null;
  mclSource?: string;
  healthEffects: HealthGroupId[];
  exposure: Exposure[];
  sourceUrl?: string;
};

export type Utility = {
  pwsId: string;
  name: string;
  city?: string;
  state?: string;
  zip: string;
  populationServed?: number;
  source: "echo" | "fixture" | "sdwis";
};

export type PackageId = "base" | "gold" | "platinum";

export type Exceedance = ContaminantResult & {
  foldOver: number;
};

export type HealthGroupScore = {
  id: HealthGroupId;
  label: string;
  contaminantCount: number;
  contaminants: string[];
};

export type CompareOutput = {
  reportedCount: number;
  overGuidelineCount: number;
  exceedances: Exceedance[];
  withinGuideline: ContaminantResult[];
  topHealthGroups: HealthGroupScore[];
};

export type CatalogItem = {
  id: string;
  name: string;
  placeholder: boolean;
  nsf: string[];
  treats: string[];
  slot: "undersink_ro" | "shower_carbon" | "whole_home";
  priceUsd: number;
  sku?: string;
  buyUrl?: string;
  priceSource?: string;
  priceAsOf?: string;
};

export type QuotePackage = {
  id: PackageId;
  label: string;
  items: CatalogItem[];
  priceUsd: number;
  covered: string[];
  uncovered: string[];
};

export type Narrative = {
  headline: string;
  summaryHtml: string;
  topGroupsHtml: string;
  vectorsHtml: string;
};

export type EpaLive = {
  healthFlag: string | null;
  seriousViolator: string | null;
  activity: string | null;
  contaminantsInViolation3yr: Array<{ code: string; name: string }>;
  currentViolationContaminants: Array<{ code: string; name: string }>;
  echoQuery: string;
  sources: string[];
};

export type SearchHit = {
  pwsId: string;
  name: string;
  type: string;
  population: number;
  city?: string;
  state?: string;
  zip: string;
  healthBasedViolations: number;
  totalViolations: number;
  source: string;
};

export type ReportResponse = {
  utility: Utility;
  compare: CompareOutput;
  packages: QuotePackage[];
  narrative: Narrative | null;
  disclaimer: string;
  dataQuality: "fixture" | "echo_partial" | "live";
  claimedFromCall?: string;
  epaLive?: EpaLive;
  systems?: SearchHit[];
  period?: string;
  detectedCount?: number;
  guidelineSet?: string;
};

export type OccurrenceFixture = {
  utility: Utility;
  demoZip: string;
  vintage: string;
  period?: string;
  detectedCount?: number;
  results: ContaminantResult[];
  claimedFromCall?: string;
  notes: string;
  sources: string[];
};

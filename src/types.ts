export enum AgentStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface KeywordOutput {
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  targetAudience: string;
  keywordAngle: string;
  recommendedTitles: string[];
}

export interface StrategyOutput {
  goal: string;
  painPoints: string[];
  uniqueAngle: string;
  ctaDirection: string;
  structure: string[];
}

export interface WritingOutput {
  title: string;
  intro: string;
  sections: { heading: string; content: string }[];
  closing: string;
  cta: string;
  fullContent: string;
}

export interface ImageOutput {
  featuredImagePrompt: string;
  sectionImagePrompts: string[];
  seo: {
    filename: string;
    altText: string;
  };
}

export interface RevisionOutput {
  status: 'LULUS' | 'REVISI';
  checklist: {
    grammar: boolean;
    flow: boolean;
    natural: boolean;
    ctaClear: boolean;
    notTooAI: boolean;
  };
  feedback?: string;
}

export interface SEOOutput {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  keywordPlacement: string[];
  internalLinkSuggestions: string[];
}

export interface PublishOutput {
  status: 'Published';
  checklist: {
    uploaded: boolean;
    imagesWebp: boolean;
    linksActive: boolean;
    tagsSet: boolean;
  };
}

export interface RatingOutput {
  seoScore: number;
  readabilityScore: number;
  conversionScore: number;
  improvementSuggestions: string[];
}

export interface WorkflowState {
  currentStep: number;
  niche: string;
  targetMarket: string;
  results: {
    keyword?: KeywordOutput | any;
    strategy?: StrategyOutput | any;
    writing?: WritingOutput | any;
    image?: ImageOutput | any;
    revision?: RevisionOutput | any;
    seo?: SEOOutput | any;
    publish?: PublishOutput | any;
    rating?: RatingOutput | any;
  };
  statuses: AgentStatus[];
  thread_id?: string;
  isPaused?: boolean;
}

export type TLogLevel = 'none' | 'debug' | 'log' | 'info' | 'warn' | 'error';

export type TSpecl = {
  steppers: string[];
  mode: 'all' | 'some';
  refs?: {
    docs: { [name: string]: { src: string } };
  };
};

export type TFeature = {
  path: string;
  feature: string;
};

export type TFeatures = TFeature[];

export type TResolvedFeature = {
  path: string;
  feature: string;
  vsteps: TVStep[];
};

export const SECTION_BACKGROUND = 'Background';

export type TAction = (arg: any) => Promise<TActionResult>;
export type TStep = {
  section?: string;
  match?: RegExp;
  gwta?: string;
  exact?: string;
  action: TAction;
};

export interface IStepper {
  shared?: TShared;
  steps: { [name: string]: TStep };
  close?(): void;
}

export interface IStepperConstructor {
  new (shared: TShared, runtime: TRuntime, logger: TLogger): IStepper;
}
export interface TLogger {
  debug: (what: any) => void;
  log: (what: any) => void;
  info: (what: any) => void;
  warn: (what: any) => void;
  error: (what: any) => void;
}

export type TShared = {
  [name: string]: string;
};

export type TVStep = {
  in: string;
  seq: number;
  actions: TFound[];
};
export type TFound = { name: string; step: TStep; named?: TNamed | undefined };
export type TNamed = { [name: string]: string };

export const OK: TOKActionResult = { ok: true };

export type TResultError = {
  context: any;
  details?: any;
};

export type TResult = {
  ok: boolean;
  results?: TFeatureResult[];
  failure?: {
    stage: 'Expand' | 'Resolve' | 'Investigate';
    error: TResultError;
  };
};

export type TActionResult = TOKActionResult | TNotOKActionResult;

export type TStepActionResult = TActionResult & {
  name: string;
}


export type TOKActionResult = {
  ok: true;
};

export type TNotOKActionResult = {
  ok: false;
  message: string;
  details?: any
};

export type TFeatureResult = {
  skip?: boolean;
  comments?: string;
  path: string;
  ok: boolean;
  stepResults: TStepResult[];
  failure?: TFeatureResultFailure;
};

export type TFeatureResultFailure = {
  message: string;
  error: any;
  expected?: any;
};

export type TStepResult = {
  ok: boolean;
  actionResults: TStepActionResult[];
  in: string;
  seq: number;
};

export type TRuntime = { [name: string]: any };

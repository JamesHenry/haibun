import {existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { IStepper, IStepperConstructor,  TLogger,  TRuntime, TShared, TSpecl, TStep } from './defs';

// FIXME tired of wrestling with ts/import issues
export async function use(module: string) {
  const re: any = (await import(module)).default;
  return re;
}

export async function getSteppers({steppers = [], shared, logger, addSteppers = [], runtime = {}} : {steppers: string[], shared: TShared, logger: TLogger, addSteppers?: IStepperConstructor[], runtime: TRuntime}) {
  const allSteppers: IStepper[] = [];
  for (const s of steppers) {
    const S: IStepperConstructor = await use(`../steps/${s}`);
    const stepper = new S(shared, runtime, logger);
    allSteppers.push(stepper);
  }
  for (const S of addSteppers) {
    const stepper = new S(shared, runtime, logger);
    allSteppers.push(stepper);
  }
  return allSteppers;
}

export async function recurse(dir: string, type: string, where: any) {
  const files = readdirSync(dir);
  const subdirs = [];
  for (const f of files) {
    const here = `${dir}/${f}`;
    if (statSync(here).isDirectory()) {
      subdirs.push(here);
    } else if (f.endsWith(`.${type}`)) {
      where[f.replace(`.${type}`, '')] = { feature: readFileSync(here, 'utf-8') };
    }
  }
  for (const f of subdirs) {
    const node = {};
    await recurse(f, type, node);
    where[f] = node;
  }
  return where;
}

export function getNamedMatches(what: string, step: TStep) {
const named = (step.match as RegExp).exec(what);
  return named?.groups;
}

const DEFAULT_CONFIG: TSpecl = {
  mode: 'all',
  features: {},
  steppers: ['vars'],
};

export function getConfigOrDefault(base: string): TSpecl {
  const f = `${base}/config.json`;
  if (existsSync(f)) {
    try {
      const specl = JSON.parse(readFileSync(f, 'utf-8'));
      return specl;
    } catch (e) {
      console.error('missing or not valid project config file.');
      process.exit(1);
    }
  }
  return DEFAULT_CONFIG;
}

export function getActionable(value: string) {
  return value.replace(/#.*/, '').trim();
}

export function describeSteppers(steppers: IStepper[]) {
  return steppers.map((stepper) => {
    return Object.keys(stepper.steps).map((name) => {
      return `${stepper.constructor.name}:${name}`;
    });
  }).join(' ');
}

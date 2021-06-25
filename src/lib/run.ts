import { existsSync } from 'fs';
import { TSpecl, IStepper, IStepperConstructor, TResult, TLogger, TShared, TRuntime, TFeatures, TWorld } from './defs';
import { expandBackgrounds, expandFeatures } from './features';
import { Executor } from './Executor';
import { parse } from './parse';
import { Resolver } from './Resolver';
import { getSteppers, recurse } from './util';

export async function run({ specl, base, world, addSteppers = [], featureFilter = '', }: { specl: TSpecl, world: TWorld; base: string; addSteppers?: IStepperConstructor[]; featureFilter?: string; }): Promise<{ result: TResult }> {
  const features = await recurse(`${base}/features`, [/\.feature$/, featureFilter]);
  const backgrounds = existsSync(`${base}/backgrounds`) ? await recurse(`${base}/backgrounds`, [/\.feature$/]) : [];

  const steppers: IStepper[] = await getSteppers({ steppers: specl.steppers, addSteppers, world });
  if (specl.refs) {
    await parse(specl, base, steppers);
  }

  let expandedFeatures;
  try {
    expandedFeatures = await expand(backgrounds, features);
  } catch (error: any) {
    return { result: { ok: false, failure: { stage: 'Expand', error: error.message } } };
  }

  let mappedValidatedSteps;
  try {
    const resolver = new Resolver(steppers,  specl.mode, world);
    mappedValidatedSteps = await resolver.resolveSteps(expandedFeatures);
  } catch (error: any) {
    return { result: { ok: false, failure: { stage: 'Resolve', error: { details: error.message, context: { steppers, mappedValidatedSteps } } } } };
  }

  const executor = new Executor(steppers, world);
  const result = await executor.execute(mappedValidatedSteps);
  if (!result.ok) {
    result.failure = { stage: 'Execute', error: { context: result.results?.filter((r) => !r.ok).map((r) => r.path) } };
  }
  return { result };
}

async function expand(backgrounds: TFeatures, features: TFeatures) {
  const expandedBackgrounds = await expandBackgrounds(backgrounds);

  const expandedFeatures = await expandFeatures(features, expandedBackgrounds);
  return expandedFeatures;
}

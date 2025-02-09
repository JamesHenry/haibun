import { AStepper, OK, TResolvedFeature, TStep } from './defs.js';
import { getNamedMatches, namedInterpolation, matchGroups, getNamedToVars } from './namedVars.js';
import { Resolver } from '../phases/Resolver.js';
import { actionNotOK, createSteppers } from './util/index.js';
import { asExpandedFeatures, getDefaultWorld, testWithDefaults } from './test/lib.js';
import { withNameType } from './features.js';

describe('namedMatches', () => {
  const step: TStep = {
    match: /^(?<one>.*?) is (?<two>.*?)$/,
    action: async () => actionNotOK('test'),
  };

  it('gets named matches', () => {
    expect(getNamedMatches(step.match!, 'It is set')).toEqual({ one: 'It', two: 'set' });
  });
});

describe('namedInterpolation', () => {
  test('gets string', () => {
    expect(namedInterpolation('hi').str).toEqual('hi');
  });
  test('gets var', () => {
    expect(namedInterpolation('{hi}')).toEqual({ str: `${matchGroups(0)}`, vars: [{ name: 'hi', type: 'string' }] });
  });
  test('gets var with type', () => {
    expect(namedInterpolation('{hi: string}')).toEqual({ str: `${matchGroups(0)}`, vars: [{ name: 'hi', type: 'string' }] });
  });
  test('gets var with post string', () => {
    expect(namedInterpolation('{hi} eh')).toEqual({ str: `${matchGroups(0)} eh`, vars: [{ name: 'hi', type: 'string' }] });
  });
  test('gets vars', () => {
    expect(namedInterpolation('{hi} and {there}')).toEqual({
      str: `${matchGroups(0)} and ${matchGroups(1)}`,
      vars: [
        { name: 'hi', type: 'string' },
        { name: 'there', type: 'string' },
      ],
    });
  });
  test('gets vars with post text', () => {
    expect(namedInterpolation('{hi} and {there} eh')).toEqual({
      str: `${matchGroups(0)} and ${matchGroups(1)} eh`,
      vars: [
        { name: 'hi', type: 'string' },
        { name: 'there', type: 'string' },
      ],
    });
  });
  test('throws for bad type', () => {
    expect(() => namedInterpolation('{hi: wtw}')).toThrow();
  });
});
describe('namedInterpolation regexes', () => {
  test('regexes single', () => {
    const r = new RegExp(namedInterpolation('{ v1: string } ').str);

    expect(r.exec('"hi" there')?.groups?.q_0).toBe('hi');
    expect(r.exec('<hi> there')?.groups?.c_0).toBe('hi');
    expect(r.exec('`hi` there')?.groups?.b_0).toBe('hi');
    expect(r.exec('hi there')?.groups?.t_0).toBe('hi');
  });

  test('regexes two', () => {
    const r2 = new RegExp(namedInterpolation('{ v1 } is { v2 }').str);
    const x = r2.exec('this is that');
    expect(x?.groups?.t_0).toBe('this');
    expect(x?.groups?.t_1).toBe('that');
  });
});

describe('getNamedWithVars', () => {
  class TestStepper extends AStepper {
    steps = {
      gwtaInterpolated: {
        gwta: 'is {what}',
        action: async () => OK,
      },
    };
  }
  const { world } = getDefaultWorld(0);
  test('gets var', async () => {
    const steppers = await createSteppers([TestStepper]);
    const resolver = new Resolver(steppers, '', world);
    world.shared.set('exact', 'res');
    const features = asExpandedFeatures([withNameType('l1', 'is `exact`')]);
    const res = await resolver.resolveSteps(features);
    const { vsteps } = res[0] as TResolvedFeature;
    expect(vsteps[0].actions[0]).toBeDefined();
    const val = getNamedToVars(vsteps[0].actions[0], world, vsteps[0]);
    expect(val?.what).toBe('res');
  });
});

describe('getEnv', () => {
});

describe('context', () => {
  it.only('assigns [HERE]', async () => {
    const feature = { path: '/features/here.feature', content: 'set [HERE] to y' };
    const verify = { path: '/features/verify.feature', content: 'here is "y"' };
    const res = await testWithDefaults([feature, verify], []);
    expect(res.world.shared.get('here')).toBe('y');
  });
  it('rejects unknown', async () => {
    const fails = { path: '/features/here.feature', content: 'set [NOTHING] to y' };
    expect(async () => await testWithDefaults([fails], [])).resolves.toThrow();
  });
});

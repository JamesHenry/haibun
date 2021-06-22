import Logger, { LOGGER_NONE } from './Logger';
import { run } from './run';
import { TestSteps } from './TestSteps';
import { getConfigOrDefault } from './util';

describe('run self-contained', () => {
  it('Backgrounds', async () => {
    const base = process.cwd() + '/test/projects/specl/self-contained';
    const specl = getConfigOrDefault(base);

    const { result } = await run({ specl, base, addSteppers: [TestSteps], logger: new Logger(LOGGER_NONE) });

    expect(result.ok).toBe(true);
    expect(result.results!.length).toBe(1);
    const t = result.results![0];
    expect(t).toBeDefined();
    expect(t.ok).toBe(true);
    expect(t.stepResults.length).toBe(2);
    expect(t.stepResults.every((r) => r.ok === true)).toBe(true);
  });
});

describe('run backgrounds', () => {
  it('background', async () => {
    const base = process.cwd() + '/test/projects/specl/with-background';
    const specl = getConfigOrDefault(base);

    const { result } = await run({ specl, base, addSteppers: [TestSteps], logger: new Logger(LOGGER_NONE) });

    expect(result.ok).toBe(true);

    expect(result.results!.length).toBe(1);
    const t = result.results![0];
    expect(t).toBeDefined();
    expect(t.ok).toBe(true);
    expect(t.stepResults.length).toBe(3);
    expect(t.stepResults.every((r) => r.ok === true)).toBe(true);
  });
});

describe('fails', () => {
  it('fails', async () => {
    const base = process.cwd() + '/test/projects/specl/fails';
    const specl = getConfigOrDefault(base);

    const { result } = await run({ specl, base, addSteppers: [TestSteps], logger: new Logger(LOGGER_NONE) });

    expect(result.ok).toBe(false);

    expect(result.failure?.stage).toBe('Resolve');

    expect(result.failure?.error.details.startsWith('no step found for When I fail')).toBe(true);
  });
});

describe('step fails', () => {
  it('step fails', async () => {
    const base = process.cwd() + '/test/projects/specl/step-fails';
    const specl = getConfigOrDefault(base);

    const { result } = await run({ specl, base, addSteppers: [TestSteps], logger: new Logger(LOGGER_NONE) });

    expect(result.ok).toBe(false);

    expect(result.failure?.stage).toBe('Investigate');
  });
});

describe('multiple', () => {
  it('fail and pass', async () => {
    const base = process.cwd() + '/test/projects/specl/multiple';
    const specl = getConfigOrDefault(base);

    const { result } = await run({ specl, base, addSteppers: [TestSteps], logger: new Logger(LOGGER_NONE) });

    expect(result.ok).toBe(false);
    expect(result.results?.length).toBe(2);

    expect(result.failure?.stage).toBe('Investigate');
  });
});

describe('step vars', () => {
  it('step vars', async () => {
    const base = process.cwd() + '/test/projects/specl/vars';
    const specl = getConfigOrDefault(base);

    const { result, shared } = await run({ specl, base, addSteppers: [TestSteps], logger: new Logger(LOGGER_NONE) });

    expect(result.ok).toBe(true);
    expect(shared.var).toBe('1');
    expect(shared['Var 2']).toBe('2');
    expect(shared['Var 3']).toBe('3');
  });
});

describe('handles exception', () => {
  it('handles exception', async () => {
    const base = process.cwd() + '/test/projects/specl/handles-exception';
    const specl = getConfigOrDefault(base);

    const { result } = await run({ specl, base, addSteppers: [TestSteps], logger: new Logger(LOGGER_NONE) });

    expect(result.ok).toBe(false);
    
    expect(result.results?.length).toBe(1);
  });
});

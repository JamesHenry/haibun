import { TNamed, AStepper } from '../defs.js';
import { actionNotOK, actionOK } from '../util/index.js';
import { WorkspaceContext } from '../contexts.js'

const TestSteps = class TestSteps extends AStepper {
  steps = {
    fails: {
      gwta: 'fail',
      action: async () => actionNotOK('test fail'),
    },
    test: {
      exact: 'When I have a test',
      action: async () => actionOK(),
    },
    passes: {
      exact: 'Then the test should pass',
      action: async () => actionOK(),
    },
    named: {
      match: /^Then the parameter (?<param>.+) is accepted$/,
      action: async ({ param }: TNamed) => {
        return param === 'x' ? actionOK() : actionNotOK('test');
      },
    },
    throws: {
      gwta: 'throw an exception',
      action: async () => {
        throw Error(`<Thrown for test case>`);
      },
    },
    buildsWithFinalizer: {
      gwta: 'builds with finalizer',
      action: async () => actionOK(),
      build: async () => {
        return {
          ...actionOK(),
          finalize: (workspace: WorkspaceContext) => {
            this.getWorld().shared.set('done', 'ok');
          },
        };
      },
    },
  };
};


export default TestSteps;
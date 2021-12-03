import { onCurrentTypeForDomain } from '@haibun/core/build/steps/vars';
import { AStepper, TNamed, IRequireDomains } from '@haibun/core/build/lib/defs';
import { runWith } from '@haibun/core/build/lib/run';
import { asFeatures, getDefaultWorld } from '@haibun/core/build/lib/test/lib';
import { getOptionsOrDefault, actionOK } from '@haibun/core/build/lib/util';
import DomainWebPage, { webControl, webPage } from './domain-webpage';

const TestStepsRequiresDomain = class TestStepsRequiresDomain extends AStepper implements IRequireDomains {
  requireDomains = [webPage, webControl];
  steps = {
    onType: {
      gwta: `on the {name} {type}$`,
      action: async ({ name, type }: TNamed) => {
        const location = onCurrentTypeForDomain({ name, type: webPage }, this.getWorld());
        return actionOK(location);
      },
    },
    test: {
      gwta: `Press the {what: ${webControl}}`,
      action: async (named: TNamed) => {
        return actionOK();
      },
    },
  };
};

describe('domain webpage', () => {
  it('domain object from background', async () => {
    const specl = getOptionsOrDefault();
    const key = '/backgrounds/p1';

    const { world } = getDefaultWorld(0);
    const features = asFeatures([{ path: '/features/test.feature', content: `Backgrounds: p1.${webPage}\n\nOn the ${key} ${webPage}\nPress the submit button` }]);
    const backgrounds = asFeatures([{ path: `/backgrounds/p1.${webPage}.feature`, content: '' }]);
    const { result } = await runWith({ specl, features, backgrounds, addSteppers: [TestStepsRequiresDomain, DomainWebPage], world });

    expect(result.ok).toBe(true);

    // FIXME wrong result
    expect(result.results![0].stepResults[0].actionResults[0].topics).toEqual("http://localhost:8123//backgrounds/p1");
  });
});

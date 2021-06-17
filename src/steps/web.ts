import { IStepper, IStepperConstructor, notOk, ok, TLogger, TResult, TRuntime, TShared } from '../lib/defs';
import { BrowserFactory } from '../BrowserFactory';
import { Page } from 'playwright';

type TStepWithPage = {
  gwta: string;
  action?: any;
  withPage?: (page: Page, vars: any) => Promise<TResult>;
};

const Web: IStepperConstructor = class Web implements IStepper {
  shared: TShared;
  logger: TLogger;
  bf: BrowserFactory;
  runtime: TRuntime;

  constructor(shared: TShared, runtime: TRuntime, logger: TLogger) {
    this.shared = shared;
    this.logger = logger;
    this.runtime = runtime;
    this.bf = new BrowserFactory(logger);
    const preSteps: { [name: string]: TStepWithPage } = {
      //                                      INPUT
      inputVariable: {
        gwta: 'set the inputfield "(?<field>.+)" to <(?<what>.+)>',
        withPage: async (page: Page, { field, what }: { field: string; what: string }) => {
          const where = this.shared[field] || field;
          const val = this.shared[what] || what;
          await page.fill(where, val);
          return ok;
        },
      },
      input: {
        gwta: 'set the inputfield "(?<field>.+)" to "(?<what>.+)"',
        withPage: async (page: Page, { field, what }: { field: string; what: string }) => {
          field = field.replace(/"/g, '');
          const where = this.shared[field];
          await page.fill(where, what);
          return ok;
        },
      },
      selectionOption: {
        gwta: 'select the option "(?<option>.+)" for `(?<id>.+)`',
        withPage: async (page: Page, { option, id }: { option: string; id: string }) => {
          const what = this.shared[id] || id;

          const res = await page.selectOption(what, { label: option });
          // FIXME have to use id value
          // return res === [id] ? ok : {...notOk, details: { message: `received ${res} selecting from ${what} with id ${id}`}};
          return ok;
        },
      },

      //                ASSERTIONS
      seeText: {
        gwta: 'should see "(?<text>.+)"',
        withPage: async (page: Page, { text }: { text: string }) => {
          let textContent: string | null;
          for (let a = 0; a < 2; a++) {
            textContent = await page.textContent('body', { timeout: 1e9 });
            if (textContent?.toString().includes(text)) {
              return ok;
            }
          }
          return { ...notOk, details: `Did not find text in ${textContent!?.length} characters starting with ${textContent!?.trim().substr(0, 1e9)}` };
        },
      },

      beOnPage: {
        gwta: 'should be on the (?<name>.+) page',
        withPage: async (page: Page, { name }: { name: string }) => {
          await page.waitForNavigation();
          const uri = this.shared[name];
          let nowon;
          nowon = await page.url();
          if (nowon === uri) {
            return ok;
          }
          return { ...notOk, error: `expected ${uri} but on ${nowon}` };
        },
      },
      URIContains: {
        gwta: 'URI should include (?<what>.+)',
        withPage: async (page: Page, { what }: { what: string }) => ((await page.url().includes(what)) ? ok : notOk),
      },
      URIStartsWith: {
        gwta: 'URI should start with (?<start>.+)',
        withPage: async (page: Page, { start }: { start: string }) => ((await page.url().startsWith(start)) ? ok : notOk),
      },
      URIMatches: {
        gwta: 'URI should match (?<what>.+)',
        withPage: async (page: Page, { what }: { what: string }) => ((await page.url()) === what ? ok : notOk),
      },

      //                  CLICK

      clickOn: {
        gwta: 'click on (?<name>.[^s]+)',
        withPage: async (page: Page, { name }: { name: string }) => {
          const what = this.shared[name] || `text=${name}`;
          await page.click(what);
          return ok;
        },
      },
      clickCheckbox: {
        gwta: 'click the checkbox (?<name>.+)',
        withPage: async (page: Page, { name }: { name: string }) => {
          const what = this.shared[name] || name;
          this.logger.log(`click ${name} ${what}`);
          await page.click(what);
          return ok;
        },
      },
      clickShared: {
        gwta: 'click `(?<id>.+)`',
        withPage: async (page: Page, { id }: { id: string }) => {
          const name = this.shared[id];
          await page.click(name);
          return ok;
        },
      },
      clickQuoted: {
        gwta: 'click "(?<name>.+)"',
        withPage: async (page: Page, { name }: { name: string }) => {
          await page.click(`text=${name}`);
          return ok;
        },
      },
      clickLink: {
        gwta: 'click the link (?<uri>.+)',
        withPage: async (page: Page, { name }: { name: string }) => {
          const field = this.shared[name] || name;
          await page.click(field);
          return ok;
        },
      },

      clickButton: {
        gwta: 'click the button (?<id>.+)',
        withPage: async (page: Page, { id }: { id: string }) => {
          const field = this.shared[id] || id;
          const a = await page.click(field);

          return ok;
        },
      },

      //                          NAVIGATION
      openPage: {
        gwta: 'open the (?<name>.+) page',
        withPage: async (page: Page, { name }: { name: string }) => {
          const uri = this.shared[name];
          return (await page.goto(uri)) ? ok : notOk;
        },
      },
      pressBack: {
        gwta: 'press the back button',
        withPage: async (page: Page) => {
          await page.goBack();
          return ok;
        },
      },

      //                          BROWSER
      usingChrome: {
        gwta: `using Chrome browser`,
        action: async () => {
          return ok;
        },
      },

      usingFirefox: {
        gwta: `using Firefox browser`,
        action: async () => {
          return ok;
        },
      },

      //                          MISC
      assertOpen: {
        gwta: '(?<what>.+) is expanded with the (?<using>.+)',
        withPage: async (page: Page, { what, using }: { what: string; using: string }) => {
          const v = this.shared[what];
          const u = this.shared[using];
          const isVisible = await page.isVisible(v);
          if (!isVisible) {
            await page.click(u);
          }
          return ok;
        },
      },
      pauseSeconds: {
        gwta: 'pause for (?<text>.+)s',
        action: async ({ ms }: { ms: string }) => {
          const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

          const seconds = parseInt(ms, 10) * 1000;
          await sleep(seconds);
          return ok;
        },
      },
    };
    const steps = Object.entries(preSteps).reduce((a, [p, step]) => {
      const stepper = step as any;
      if (!stepper.withPage) {
        return { ...a, [p]: step };
      }
      (step as any).action = async (input: any) => {
        try {
          return await this.pageRes((step as any).withPage, input, p);
        } catch (e) {
          logger.log(e);
          return { ...notOk };
        }
      };
      return { ...a, [p]: step };
    }, {});

    this.steps = steps;
  }

  async pageRes(method: any, input: any, p: string) {
    const page = await this.bf.getPage();

    this.runtime.page = page;
    const res = await method(page, input);
    return res;
  }

  close() {
    this.bf.browser?.close();
  }

  steps = {};
};
export default Web;

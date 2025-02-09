import ContentController from './content-controller.js';
import { Store } from '../services/Store.js';
// // import Overlay from '@/modules/overlay'
import Recorder from '../modules/recorder/index.js';

declare global {
  interface Window { contentController: ContentController }
  interface Window { pptRecorderAddedControlListeners: any; }
}

const bg = document.body.style.backgroundColor;
document.body.style.backgroundColor = 'orange';
setTimeout(() => { document.body.style.backgroundColor = bg; }, 1000);
const store = new Store();
window.contentController = new ContentController({
  // overlay: new Overlay({ store }),
  recorder: new Recorder({ store }).init(),
  store
});


// console.log('init headlessController');

// window.contentController.init();


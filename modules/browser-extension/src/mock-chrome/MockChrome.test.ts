import MockChrome from './MockChrome.js';

const mockChrome = new MockChrome();

describe('MockChrome', () => {
    it('addListener', (done) => {
        mockChrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            expect(message).toEqual({ action: 'test' });
            done();
        });
        mockChrome.runtime.sendMessage({ action: 'test' });
    }, 500)
})
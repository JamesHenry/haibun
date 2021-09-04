import { IStepper, IExtensionConstructor, OK, TWorld, TNamed, TVStep } from '@haibun/core/build/lib/defs';
import { TLogLevel } from '@haibun/core/build/lib/interfaces/logger';
import { getFromRuntime } from '@haibun/core/build/lib/util';
import { IWebServer } from '@haibun/core/build/lib/interfaces/webserver';

import WebSocket from 'ws';
import { ISubscriber } from '@haibun/core/build/lib/interfaces/logger';
import path from 'path';
// Fixme
type TWS = { on: (arg0: string, arg1: (message: any) => void) => void; send: (arg0: string) => void };
class WebSocketServer implements ISubscriber {
  buffered: any[] = [];
  wss: WebSocket.Server;
  clients: TWS[] = [];
  async connection(ws: TWS) {
    ws.on('message', (message) => {
      console.log('received: %s', message);
      if (message === 'catchup') {
        ws.send(JSON.stringify(this.buffered));
        this.clients.push(ws);
      }
    });
  }
  constructor() {
    this.wss = new WebSocket.Server({ port: 7071 });
    this.wss.on('connection', this.connection.bind(this));
  }
  out(level: TLogLevel, message: any) {
    const content = JSON.stringify({ message: `level ${message}` });
    this.buffered.push(content);
    for (const client of this.clients) {
      client.send(content);
    }
  }
}

const LoggerWebsockets: IExtensionConstructor = class LoggerWebsockets implements IStepper {
  world: TWorld;
  ws: WebSocketServer | undefined;

  getWebSocketServer() {
    if (this.ws) {
      return this.ws;
    }
    this.ws = new WebSocketServer();
    return this.ws;
  }

  constructor(world: TWorld) {
    this.world = world;
  }

  steps = {
    log: {
      gwta: 'log to websockets',
      action: async () => {
        const wss = this.getWebSocketServer();
        this.world.logger.addSubscriber(wss);
        return OK;
      },
    },
    subscribe: {
      gwta: 'serve websocket log at {page}',
      action: async ({ page }: TNamed, vstep: TVStep) => {
        const webserver = <IWebServer>getFromRuntime(this.world.runtime, 'webserver');

        const name = vstep.actions[0].name;
        webserver.addKnownStaticFolder(path.join(__dirname, '../res/ws'), `/${page}`);

        return OK;
      },
    },
  };
};
export default LoggerWebsockets;

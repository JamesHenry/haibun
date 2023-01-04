import Logger from './Logger';
import { IConnectedLogger, ILoggerKeepAlive, ILogOutput, TLogLevel, TMessageContext, TOutputEnv } from './interfaces/logger';
import { TTag } from './defs';

export class ConnectedLogger extends Logger implements IConnectedLogger {
  keepalive?: ILoggerKeepAlive;
  constructor(output: ILogOutput, tag: TTag) {
    const res: TOutputEnv = { output, tag };
    super(res);
  }
  async connect() {
    this.keepalive?.start();
  }

  async disconnect() {
    this.keepalive?.stop();
  }

  addKeepalive(keepAlive: ILoggerKeepAlive) {
    this.keepalive = keepAlive;
  }

  out(level: TLogLevel, message: any, mctx?: TMessageContext) {
    const content = { message, level, mctx };
    console.error('fixme; topic changed to context');
  }
}

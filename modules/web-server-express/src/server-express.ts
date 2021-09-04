import { statSync, existsSync } from 'fs';
import express, { RequestHandler } from 'express';

import { IWebServer, TRouteType } from '@haibun/core/build/lib/interfaces/webserver';
import { TLogger } from '@haibun/core/src/lib/interfaces/logger';

export const DEFAULT_PORT = 8123;

export class ServerExpress implements IWebServer {
  logger: TLogger;
  static listener: any;
  static app = express();
  static mounted: { [named: string]: string } = {};
  base: string;
  port: number;
  constructor(logger: TLogger, base: string, port: number = DEFAULT_PORT) {
    this.logger = logger;
    this.base = base;
    this.port = port;
  }

  async listening() {
    if (!ServerExpress.listener) {
      ServerExpress.listener = await ServerExpress.app.listen(this.port, () => this.logger.log(`Server listening on port: ${this.port}`));
    } else {
      this.logger.log('express already started');
    }
  }

  async addRoute(type: TRouteType, path: string, route: RequestHandler) {
    try {
      const alreadyMounted = this.checkMountBadOrMounted(path, route.toString());
      if (alreadyMounted) {
        return;
      }
    } catch (e: any) {
      return e.message;
    }
    this.logger.log(`serving route from ${path}`);

    await ServerExpress.app[type](path, route);
    await this.listening();
  }

  // add a static folder restricted to relative paths from files
  async addStaticFolder(relativeFolder: string, mountAt: string = '/'): Promise<string | undefined> {
    if (relativeFolder !== relativeFolder.replace(/[^a-zA-Z-0-9\/-_]/g, '').replace(/^\//g, '')) {
      throw Error(`mount folder ${relativeFolder} has illegal characters`);
    }
    const folder = [this.base, relativeFolder].join('/');
    return this.doAddStaticFolder(folder, mountAt);
  }

  // add a static folder at any path
  async addKnownStaticFolder(folder: string, mountAt: string = '/'): Promise<string | undefined> {
    return this.doAddStaticFolder(folder, mountAt);
  }

  async doAddStaticFolder(folder: string, mountAt: string = '/'): Promise<string | undefined> {
    try {
      const alreadyMounted = this.checkMountBadOrMounted(mountAt, folder);
      if (alreadyMounted) {
        return;
      }
    } catch (e: any) {
      return e.message;
    }
    if (!existsSync(folder)) {
      throw Error(`"${folder}" doesn't exist`);
    }
    const stat = statSync(folder);
    if (!stat.isDirectory()) {
      throw Error(`"${folder}" is not a directory`);
    }

    ServerExpress.mounted[mountAt] = folder;
    this.logger.info(`serving files from ${folder} at ${mountAt}`);
    await ServerExpress.app.use(mountAt, express.static(folder));
    await this.listening();
    return;
  }

  checkMountBadOrMounted(loc: string, what: string): boolean {
    if (!ServerExpress.listener) {
      throw Error(`listening must be called before mount`);
    }
    if (!loc) {
      throw Error(`missing mount location`);
    }

    const alreadyMounted = ServerExpress.mounted[loc];
    if (alreadyMounted === what) {
      this.logger.log(`${alreadyMounted} already mounted at ${loc}`);
      return true;
    } else if (alreadyMounted && alreadyMounted !== what) {
      throw Error(`cannot mount ${what} at ${loc}, ${alreadyMounted} is already mounted}`);
    }
    return false;
  }

  async close() {
    this.logger.info('closing server');
    await ServerExpress.listener?.close();
  }
}

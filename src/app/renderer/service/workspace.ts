import { FileJSON } from '../../common/io/file';
import { DirectoryJSON } from '../../common/io/directory';
import { Subject } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import * as _ from 'lodash';
import * as Promise from 'bluebird';

/**
 * The workspace service is holding a json representation of the workspace files.
 *
 * @export
 * @class WorkspaceService
 * @todo Implement watch task on the directory
 */
@Injectable()
export class WorkspaceService {

  private internalFiles: DirectoryJSON;
  private internalFolders: DirectoryJSON[];
  private internalState: 'init' | 'ready' | 'fail' = 'init';
  private internalError;

  private initSource = new Subject<void>();
  private readySource = new Subject<void>();
  private failSource = new Subject<void>();

  init$ = this.initSource.asObservable();
  ready$ = this.readySource.asObservable();
  fail$ = this.failSource.asObservable();

  /**
   * Initializes the given directory as the workspace directory.
   * The loaded json representation gets resolved on success.
   *
   * @param {string} rootDir The full path of the workspace.
   * @returns {Promise}
   */
  init(rootDir: string): Promise<DirectoryJSON> {
    if (this.internalState !== 'init')
      return Promise.resolve(this.internalFiles);
    this.internalState = 'init';
    this.initSource.next();
    return new Promise<DirectoryJSON>((resolve, reject) => {
      let id = _.uniqueId('asset-service-');
      ipcRenderer.send('directory:scan', rootDir, id, true);
      ipcRenderer.once(`directory:scan:${id}:done`, (event, json) => {
        ipcRenderer.removeAllListeners(`directory:scan:${id}:fail`);
        this.internalFiles = json;
        this.internalFolders = this.getDirectories(this.internalFiles);
        this.internalState = 'ready';
        this.readySource.next();
        resolve(this.internalFiles);
      });
      ipcRenderer.once(`directory:scan:${id}:fail`, (event, e) => {
        ipcRenderer.removeAllListeners(`directory:scan:${id}:done`);
        this.internalState = 'fail';
        this.internalError = e;
        this.failSource.next();
        reject(e);
      });
    });
  }

  find(path: string): DirectoryJSON | FileJSON {
    if (path == this.internalFiles.path)
      return this.internalFiles;
    let found: DirectoryJSON | FileJSON = null;
    let searchChildren = (children: (DirectoryJSON | FileJSON)[]) => {
      let f = null;
      children.some(child => {
        if (child.path == path)
          f = child;
        else if ((<DirectoryJSON>child).children !== void 0)
          f = searchChildren((<DirectoryJSON>child).children);
        return f !== null;
      });
      return f;
    };
    return searchChildren(this.internalFiles.children);
  }

  /**
   * @param {DirectoryJSON} directory
   * @returns {DirectoryJSON[]} Filtered list of the given directory structure with directories only.
   */
  getDirectories(directory: DirectoryJSON): DirectoryJSON[] {
    let getDirectories = (children: (DirectoryJSON | FileJSON)[]) => {
      let folders = children.filter(child => (<DirectoryJSON>child).children !== void 0);
      folders = <DirectoryJSON[]>folders.map(folder=> _.extend({ }, folder));
      folders.forEach(folder =>(<DirectoryJSON>folder).children = getDirectories( (<DirectoryJSON>folder).children ));
      return <DirectoryJSON[]>folders;
    };
    return getDirectories(directory.children);
  }

  getFiles(path: string): (DirectoryJSON | FileJSON)[] {
    let found: DirectoryJSON | FileJSON = this.find(path);
    if (found && (<DirectoryJSON>found).children !== void 0)
      return (<DirectoryJSON>found).children;
    else
      return null;
  }

  /**
   * @readonly
   * @type {DirectoryJSON[]} folders A filtered version of WorkspaceService#files, which contains only directories.
   */
  get directories(): DirectoryJSON[] {
    if (!this.internalFolders)
      throw 'Workspace not initialized yet!';

    return this.internalFolders;
  }

  /**
   * @readonly
   * @type {string} state The current scanning state
   */
  get state(): string {
    return this.internalState;
  }

  /**
   * @readonly
   * @type {DirectoryJSON} directory The json representation of the workspace root folder.
   */
  get directory(): DirectoryJSON {
    return this.internalFiles;
  }

  /**
   * @readonly
   * @type {((DirectoryJSON | FileJSON)[])} files The list of files and directories at the workspace root.
   */
  get files(): (DirectoryJSON | FileJSON)[] {
    return this.internalFiles.children;
  }

  get error() {
    return this.internalError;
  }
}
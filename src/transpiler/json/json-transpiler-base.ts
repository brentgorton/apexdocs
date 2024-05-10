import ProcessorTypeTranspiler from '../processor-type-transpiler';
import { Type } from '@cparra/apex-reflection';
import { FileContainer } from '../file-container';
import { JSONHomeFile } from '../../model/json-home-file';
import { JSONTypeFile } from '../../model/json-type-file';

export abstract class JSONTranspilerBase extends ProcessorTypeTranspiler {
  protected readonly _fileContainer: FileContainer;

  constructor() {
    super();
    this._fileContainer = new FileContainer();
  }

  abstract homeFileName(): string;

  fileBuilder(): FileContainer {
    return this._fileContainer;
  }

  onBeforeProcess = (types: Type[]) => {
    this._fileContainer.pushFile(new JSONHomeFile(this.homeFileName(), types));
  };

  onProcess(type: Type): void {
    // this._fileContainer.pushFile(new JSONTypeFile(type));
  }
}

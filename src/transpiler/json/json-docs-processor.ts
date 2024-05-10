import { JSONTranspilerBase } from './json-transpiler-base';
import { LinkingStrategy } from '../processor-type-transpiler';

export class JSONDocsProcessor extends JSONTranspilerBase {
  homeFileName(): string {
    return 'index';
  }

  getLinkingStrategy(): LinkingStrategy {
    return 'path-relative';
  }
}

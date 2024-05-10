import { MarkdownTranspilerBase } from '../markdown-transpiler-base';
import { Type } from '@cparra/apex-reflection';
import { MarkdownHomeFile } from '../../../model/markdown-home-file';
import { NgDocMarkdownTypeFile } from '../../../model/ngdoc-markdown-type-file';
import { LinkingStrategy } from '../../processor-type-transpiler';
import { OutputFile } from '../../../model/outputFile';
import { Settings } from '../../../settings';
export class NgDocDocsProcessor extends MarkdownTranspilerBase {
  namespace: string = Settings.getInstance().getNamespacePrefix().replace('.', '');
  homeFileName(): string {
    return 'index';
  }

  onBeforeProcess = (types: Type[]) => {
    this._fileContainer.pushFile(
      new MarkdownHomeFile(this.homeFileName(), types, this.frontMatterHeader, this.namespace + '/'),
    );
    this._fileContainer.pushFile(new NgDocPageFile('Index', this.namespace, 'index'));
    this._fileContainer.pushFile(new NgDocCategory('Apex', '', 'apex', true));
    this._fileContainer.pushFile(new NgDocCategory(this.namespace, this.namespace, this.namespace));
  };

  onProcess(type: Type): void {
    this._fileContainer.pushFile(new NgDocMarkdownTypeFile(type, 1, this.frontMatterHeader));
    this._fileContainer.pushFile(new NgDocPageFile(type.name, this.namespace + '/' + type.name));
  }

  get frontMatterHeader(): string {
    return '---\nlayout: default\n---';
  }

  getLinkingStrategy(): LinkingStrategy {
    return 'path-relative';
  }
}

class NgDocCategory extends OutputFile {
  fileExtension(): string {
    return '.ts';
  }

  constructor(public title: string, public path: string, public route: string = title, public isRoot: boolean = false) {
    super('ng-doc.category', path);
    this.addText(`import { NgDocCategory } from '@ng-doc/core';`);
    if (!isRoot) {
      this.addText(`import ParentCategory from '../ng-doc.category';`);
    }
    this.addBlankLine();
    this.addText(`const ApexCategory: NgDocCategory = {`);
    this.addText(`  title: '${title}',`);
    this.addText(`  expanded: false,`);
    this.addText(`  route: '${route}',`);
    if (!isRoot) {
      this.addText(`  category: ParentCategory,`);
    }
    this.addText(`};`);
    this.addBlankLine();
    this.addText(`export default ApexCategory;`);
  }
}

class NgDocPageFile extends OutputFile {
  fileExtension(): string {
    return '.ts';
  }

  constructor(public title: string, public path: string, public route: string = title) {
    super('ng-doc.page', path);

    this._contents = `import {NgDocPage} from '@ng-doc/core';
import ApexCategory from '${route == 'index' ? '' : '.'}./ng-doc.category';

const ApexPage: NgDocPage = {
  title: '${title}',
  mdFile: './index.md',
  route: '${route}',
  category: ApexCategory,
  hidden: false,
  order: 999,
};

export default ApexPage;
`;
  }
}

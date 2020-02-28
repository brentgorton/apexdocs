import * as fs from 'fs';
import * as path from 'path';

import DocsProcessor from './DocsProcessor';
import MarkdownHelper from './MarkdownHelper';
import ClassModel from './model/ClassModel';

export default class JekyllDocsProcessor extends DocsProcessor {
  onBeforeProcess(classes: ClassModel[], outputDir: string) {
    // Generate index.md listing all classes
    let generator = new MarkdownHelper();

    this.addFrontMatterHeader(generator);

    generator.addTitle('Classes');
    classes.forEach(classModel => {
      generator.addBlankLine();
      generator.addLink(classModel.getClassName(), `/${classModel.getClassName()}.md/`);
      generator.addBlankLine();
      generator.addBlankLine();
      generator.addText(classModel.getDescription());

      generator.addBlankLine();
      generator.addBlankLine();
    });

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const filePath = path.join(outputDir, 'index.md');
    fs.writeFile(filePath, generator.contents, 'utf8', () => {
      // tslint:disable-next-line:no-console
      console.log('Index page generated.');
    });
  }

  private addFrontMatterHeader(generator: MarkdownHelper) {
    generator.addText('---');
    generator.addText('layout: default');
    generator.addText('---');
  }

  process(classModel: ClassModel, outputDir: string) {
    let generator = new MarkdownHelper();
    this.addFrontMatterHeader(generator);
    this.generateDocsForClass(generator, classModel, 1);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const filePath = path.join(outputDir, `${classModel.getClassName()}.md`);
    fs.writeFile(filePath, generator.contents, 'utf8', () => {
      // tslint:disable-next-line:no-console
      console.log(`${classModel.getClassName()} processed.`);
    });
  }

  generateDocsForClass(generator: MarkdownHelper, classModel: ClassModel, level: number) {
    const suffix = classModel.getIsInterface() ? 'interface' : 'class';
    generator.addTitle(`${classModel.getClassName()} ${suffix}`, level);

    if (classModel.getDescription()) {
      generator.addBlankLine();
      generator.addText(classModel.getDescription());
      generator.addBlankLine();
    }

    generator.addHorizontalRule();

    this.addConstructors(generator, level, classModel);
    this.addProperties(generator, level, classModel);
    this.addMethods(generator, level, classModel);
    this.addInnerClasses(classModel, generator, level);
  }

  private addProperties(generator: MarkdownHelper, level: number, classModel: ClassModel) {
    if (classModel.getProperties().length === 0) {
      return;
    }

    generator.addTitle('Properties', level + 1);
    generator.addBlankLine();
    classModel
      .getProperties()
      .sort((propA, propB) => {
        if (propA.getPropertyName() < propB.getPropertyName()) return -1;
        if (propA.getPropertyName() > propB.getPropertyName()) return 1;
        return 0;
      })
      .forEach(propertyModel => {
        generator.addTitle(propertyModel.getPropertyName(), 3);
        if (propertyModel.getDescription()) {
          generator.addBlankLine();
          generator.addText(propertyModel.getDescription());
        }
        generator.addBlankLine();
      });

    generator.addHorizontalRule();
  }

  private addConstructors(generator: MarkdownHelper, level: number, classModel: ClassModel) {
    if (classModel.getMethods().filter(method => method.getIsConstructor()).length === 0) {
      return;
    }

    generator.addTitle('Constructors', level + 1);
    classModel
      .getMethods()
      .filter(method => method.getIsConstructor())
      .forEach(methodModel => {
        generator.addTitle(`\`${methodModel.getSignature()}\``, level + 2);
        if (methodModel.getDescription()) {
          generator.addBlankLine();
          generator.addText(methodModel.getDescription());
        }

        if (methodModel.getExample() !== '') {
          generator.startCodeBlock();
          generator.addText(methodModel.getExample());
          generator.endCodeBlock();
          generator.addBlankLine();
        }

        generator.addBlankLine();
      });

    generator.addHorizontalRule();
  }

  private addMethods(generator: MarkdownHelper, level: number, classModel: ClassModel) {
    if (classModel.getMethods().filter(method => !method.getIsConstructor()).length === 0) {
      return;
    }

    generator.addTitle('Methods', level + 1);
    classModel
      .getMethods()
      .sort((methodA, methodB) => {
        if (methodA.getMethodName() < methodB.getMethodName()) return -1;
        if (methodA.getMethodName() > methodB.getMethodName()) return 1;
        return 0;
      })
      .filter(method => !method.getIsConstructor())
      .forEach(methodModel => {
        generator.addTitle(`\`${methodModel.getSignature()}\` → \`${methodModel.getReturnType()}\``, level + 2);
        if (methodModel.getDescription()) {
          generator.addBlankLine();
          generator.addText(methodModel.getDescription());
        }

        if (methodModel.getExample() !== '') {
          generator.startCodeBlock();
          generator.addText(methodModel.getExample());
          generator.endCodeBlock();
          generator.addBlankLine();
        }

        generator.addBlankLine();
      });

    generator.addHorizontalRule();
  }

  private addInnerClasses(classModel: ClassModel, generator: MarkdownHelper, level: number) {
    if (classModel.getChildClasses().length > 0) {
      generator.addTitle('Inner Classes', ++level);
      generator.addBlankLine();
      classModel
        .getChildClasses()
        .sort((classA, classB) => {
          if (classA.getClassName() < classB.getClassName()) return -1;
          if (classA.getClassName() > classB.getClassName()) return 1;
          return 0;
        })
        .forEach(innerClass => {
          this.generateDocsForClass(generator, innerClass, ++level);
        });
    }
  }
}
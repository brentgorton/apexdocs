import { JSONFile } from '../json-file';
import { addCustomDocCommentAnnotations } from './doc-comment-annotation-util';
import { Annotation, ClassMirror, InterfaceMirror, Type } from '@cparra/apex-reflection';
import { TypesRepository } from '../types-repository';

export function declareType(jsonFile: JSONFile, typeMirror: Type): void {
  typeMirror.annotations.forEach((currentAnnotation: Annotation) => {
    jsonFile.addBlankLine();
    jsonFile.addText(`\`${currentAnnotation.type.toUpperCase()}\``);
  });

  if (typeMirror.docComment?.descriptionLines) {
    jsonFile.addBlankLine();
    for (const currentLine of typeMirror.docComment.descriptionLines) {
      jsonFile.addText(currentLine);
    }
    jsonFile.addBlankLine();
  }

  if (typeMirror.type_name === 'class') {
    addInheritanceSectionForClass(typeMirror, jsonFile);
  }

  if (typeMirror.type_name === 'interface') {
    addInheritanceSectionForInterface(typeMirror, jsonFile);
  }

  addCustomDocCommentAnnotations(jsonFile, typeMirror);
}

function addInheritanceSectionForClass(typeMirror: Type, jsonFile: JSONFile) {
  const typeAsClass = typeMirror as ClassMirror;
  if (typeAsClass.extended_class) {
    jsonFile.addBlankLine();
    jsonFile.addText('**Inheritance**');
    jsonFile.addBlankLine();
    addParent(jsonFile, typeAsClass);
    jsonFile.addText(typeMirror.name);
    jsonFile.addBlankLine();
  }

  if (typeAsClass.implemented_interfaces.length) {
    jsonFile.addBlankLine();
    jsonFile.addText('**Implemented types**');
    jsonFile.addBlankLine();
    for (let i = 0; i < typeAsClass.implemented_interfaces.length; i++) {
      const currentName = typeAsClass.implemented_interfaces[i];
      jsonFile.addLink(currentName);
      if (i < typeAsClass.implemented_interfaces.length - 1) {
        jsonFile.addText(', ');
      }
    }
    jsonFile.addBlankLine();
  }
}

function addInheritanceSectionForInterface(typeMirror: Type, jsonFile: JSONFile) {
  const typeAsInterface = typeMirror as InterfaceMirror;
  if (typeAsInterface.extended_interfaces.length) {
    jsonFile.addBlankLine();
    jsonFile.addText('**Extended types**');
    jsonFile.addBlankLine();
    for (let i = 0; i < typeAsInterface.extended_interfaces.length; i++) {
      const currentName = typeAsInterface.extended_interfaces[i];
      jsonFile.addLink(currentName);
      if (i < typeAsInterface.extended_interfaces.length - 1) {
        jsonFile.addText(', ');
      }
    }
  }
}

function addParent(jsonFile: JSONFile, classMirror: ClassMirror) {
  if (!classMirror.extended_class) {
    return;
  }

  const parentType = TypesRepository.getInstance().getFromScopedByName(classMirror.extended_class);
  if (!parentType) {
    return;
  }

  if (parentType.type_name === 'class') {
    addParent(jsonFile, parentType as ClassMirror);
  }

  jsonFile.addLink(parentType.name);
  jsonFile.addText(' > ');
}

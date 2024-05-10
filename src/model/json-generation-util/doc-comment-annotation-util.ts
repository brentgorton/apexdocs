import { DocComment, DocCommentAnnotation } from '@cparra/apex-reflection';
import ClassFileGeneratorHelper from '../../transpiler/json/class-file-generatorHelper';
import { JSONFile } from '../json-file';

interface DocCommentAware {
  docComment?: DocComment;
}

export function addCustomDocCommentAnnotations(jsonFile: JSONFile, docCommentAware: DocCommentAware) {
  docCommentAware.docComment?.annotations
    .filter((currentAnnotation: DocCommentAnnotation) => currentAnnotation.name !== 'description')
    .forEach((currentAnnotation: DocCommentAnnotation) => {
      jsonFile.addBlankLine();
      jsonFile.addText(buildDocAnnotationText(currentAnnotation));
      jsonFile.addBlankLine();
    });

  function splitAndCapitalize(text: string) {
    const words = text.split(/[-_]+/);
    const capitalizedWords = [];
    for (const word of words) {
      capitalizedWords.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
    return capitalizedWords.join(' ');
  }

  function buildDocAnnotationText(annotation: DocCommentAnnotation) {
    let annotationBodyText = annotation.body;
    if (annotation.name.toLowerCase() === 'see') {
      annotationBodyText = ClassFileGeneratorHelper.getFileLinkByTypeName(annotation.body);
    }
    return `**${splitAndCapitalize(annotation.name)}** ${annotationBodyText}`;
  }
}

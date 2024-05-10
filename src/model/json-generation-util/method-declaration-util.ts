import { ConstructorMirror, DocComment } from '@cparra/apex-reflection';
import { JSONFile } from '../json-file';
import { ParameterMirror } from '@cparra/apex-reflection/index';
import { addCustomDocCommentAnnotations } from './doc-comment-annotation-util';
import { MethodMirrorWithInheritance } from '../inheritance';

export function declareMethod(
  jsonFile: JSONFile,
  methods: ConstructorMirror[] | MethodMirrorWithInheritance[],
  startingHeadingLevel: number,
  className = '',
): void {
  methods.forEach((currentMethod) => {
    const signatureName = isMethod(currentMethod)
      ? `${(currentMethod as MethodMirrorWithInheritance).typeReference.rawDeclaration} ${
          (currentMethod as MethodMirrorWithInheritance).name
        }`
      : className;
    jsonFile.addTitle(
      `\`${buildSignature(currentMethod.access_modifier, signatureName, currentMethod)}\``,
      startingHeadingLevel + 2,
    );

    // Inheritance tag
    if (isMethod(currentMethod)) {
      const asMethodMirror = currentMethod as MethodMirrorWithInheritance;
      if (asMethodMirror.inherited) {
        jsonFile.addBlankLine();
        jsonFile.addText('*Inherited*');
        jsonFile.addBlankLine();
      }
    }

    currentMethod.annotations.forEach((annotation) => {
      jsonFile.addBlankLine();
      jsonFile.addText(`\`${annotation.type.toUpperCase()}\``);
    });

    if (currentMethod.docComment?.description) {
      jsonFile.addBlankLine();
      jsonFile.addText(currentMethod.docComment.description);
      jsonFile.addBlankLine();
    }

    if (currentMethod.parameters.length) {
      addParameters(jsonFile, currentMethod, startingHeadingLevel);
    }

    if (isMethod(currentMethod)) {
      addReturns(jsonFile, currentMethod as MethodMirrorWithInheritance, startingHeadingLevel);
    }

    addThrowsBlock(jsonFile, currentMethod, startingHeadingLevel);

    addCustomDocCommentAnnotations(jsonFile, currentMethod);

    if (currentMethod.docComment?.exampleAnnotation) {
      addExample(jsonFile, currentMethod, startingHeadingLevel);
    }
  });

  jsonFile.addHorizontalRule();
}

type ParameterAware = {
  parameters: ParameterMirror[];
};

type DocCommentAware = {
  docComment?: DocComment;
};

function buildSignature(accessModifier: string, name: string, parameterAware: ParameterAware): string {
  let signature = `${name}(`;
  if (isMethod(parameterAware) && (parameterAware as MethodMirrorWithInheritance).memberModifiers.length) {
    signature =
      accessModifier +
      ' ' +
      (parameterAware as MethodMirrorWithInheritance).memberModifiers.join(' ') +
      ' ' +
      signature;
  } else {
    signature = accessModifier + ' ' + signature;
  }
  const signatureParameters = parameterAware.parameters.map(
    (param) => `${param.typeReference.rawDeclaration} ${param.name}`,
  );
  signature += signatureParameters.join(', ');
  return `${signature})`;
}

function addParameters(
  jsonFile: JSONFile,
  methodModel: MethodMirrorWithInheritance | ConstructorMirror,
  startingHeadingLevel: number,
) {
  if (!methodModel.docComment?.paramAnnotations.length) {
    // If there are no parameters defined in the docs then we don't want to display this section
    return;
  }

  jsonFile.addTitle('Parameters', startingHeadingLevel + 3);
  jsonFile.initializeTable('Param', 'Description');

  methodModel.docComment?.paramAnnotations.forEach((paramAnnotation) => {
    const paramName = paramAnnotation.paramName;
    const paramDescription = paramAnnotation.bodyLines.join(' ');
    jsonFile.addTableRow(`\`${paramName}\``, paramDescription);
  });

  jsonFile.addBlankLine();
}

function addReturns(jsonFile: JSONFile, methodModel: MethodMirrorWithInheritance, startingHeadingLevel: number) {
  if (!methodModel.docComment?.returnAnnotation) {
    return;
  }

  jsonFile.addTitle('Returns', startingHeadingLevel + 3);
  jsonFile.initializeTable('Type', 'Description');
  jsonFile.addTableRow(
    `\`${methodModel.typeReference.rawDeclaration}\``,
    methodModel.docComment?.returnAnnotation.bodyLines.join(' '),
  );
  jsonFile.addBlankLine();
}

function addThrowsBlock(jsonFile: JSONFile, docCommentAware: DocCommentAware, startingHeadingLevel: number) {
  if (!docCommentAware.docComment?.throwsAnnotations.length) {
    return;
  }
  jsonFile.addTitle('Throws', startingHeadingLevel + 3);
  jsonFile.initializeTable('Exception', 'Description');

  docCommentAware.docComment?.throwsAnnotations.forEach((annotation) => {
    const exceptionName = annotation.exceptionName;
    const exceptionDescription = annotation.bodyLines.join(' ');

    jsonFile.addTableRow(`\`${exceptionName}\``, exceptionDescription);
  });

  jsonFile.addBlankLine();
}

function addExample(jsonFile: JSONFile, docCommentAware: DocCommentAware, startingHeadingLevel: number) {
  jsonFile.addTitle('Example', startingHeadingLevel + 3);
  jsonFile.startCodeBlock();
  docCommentAware.docComment?.exampleAnnotation.bodyLines.forEach((line) => {
    jsonFile.addText(line, false);
  });
  jsonFile.endCodeBlock();
  jsonFile.addBlankLine();
}

function isMethod(
  method: MethodMirrorWithInheritance | ConstructorMirror | ParameterAware,
): method is ConstructorMirror {
  return (method as MethodMirrorWithInheritance).typeReference !== undefined;
}

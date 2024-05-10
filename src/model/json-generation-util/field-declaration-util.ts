import { JSONFile } from '../json-file';
import { FieldMirrorWithInheritance, FieldOrProperty, PropertyMirrorWithInheritance } from '../inheritance';

export function declareField(
  jsonFile: JSONFile,
  fields: FieldMirrorWithInheritance[] | PropertyMirrorWithInheritance[],
  startingHeadingLevel: number,
  grouped = false,
) {
  jsonFile.addBlankLine();
  fields
    .sort((propA, propB) => {
      if (propA.name < propB.name) return -1;
      if (propA.name > propB.name) return 1;
      return 0;
    })
    .forEach((propertyModel) => {
      addFieldSection(jsonFile, propertyModel, startingHeadingLevel, grouped);
    });

  jsonFile.addHorizontalRule();
}

function addFieldSection(
  jsonFile: JSONFile,
  mirrorModel: FieldOrProperty,
  startingHeadingLevel: number,
  grouped: boolean,
) {
  if (!grouped) {
    jsonFile.addTitle(
      `\`${mirrorModel.access_modifier} ${mirrorModel.name}\` → \`${mirrorModel.typeReference.rawDeclaration}\``,
      startingHeadingLevel + 2,
    );
    jsonFile.addBlankLine();
    if (mirrorModel.inherited) {
      jsonFile.addText('*Inherited*');
    }

    mirrorModel.annotations.forEach((annotation) => {
      jsonFile.addText(`\`${annotation.type.toUpperCase()}\` `);
    });

    if (mirrorModel.docComment?.description) {
      jsonFile.addBlankLine();
      jsonFile.addText(mirrorModel.docComment.description);
    }
    jsonFile.addBlankLine();
  } else {
    let annotations = '';
    const hasAnnotations = !!mirrorModel.annotations.length;
    if (hasAnnotations) {
      annotations += ' [';
    }
    mirrorModel.annotations.forEach((annotation) => {
      annotations += `\`${annotation.type.toUpperCase()}\` `;
    });
    if (hasAnnotations) {
      annotations += ']';
    }

    // If grouped we want to display these as a list
    let description = '';
    if (mirrorModel.docComment?.description) {
      description = ` - ${mirrorModel.docComment?.description}`;
    }

    let listItemText = `\`${mirrorModel.access_modifier} ${mirrorModel.name}\` → \`${mirrorModel.typeReference.rawDeclaration}\``;
    if (mirrorModel.inherited) {
      listItemText += '(*Inherited*)';
    }
    listItemText += `${annotations} ${description}`;

    jsonFile.addListItem(listItemText);
    jsonFile.addBlankLine();
  }
}

/* eslint-disable prettier/prettier */
import { Type } from '@cparra/apex-reflection';
import { TypesRepository } from '../../model/types-repository';
import { Settings } from '../../settings';
import State from '../../service/state';
import { TypeTranspilerFactory } from '../factory';

export default class ClassFileGeneratorHelper {
  private static getIsNgDoc() {
    return Settings.getInstance().config.targetGenerator == 'ngdoc';
  }

  public static getSanitizedGroup(classModel: Type) {
    if (this.getIsNgDoc()) {
      return '';
    }
    return this.getClassGroup(classModel).replace(/ /g, '-').replace('.', '');
  }

  public static getFileLink(classModel: Type) {
    const documentationRoot = !this.getIsNgDoc() ? Settings.getInstance().getRootDir() ?? '' : '';
    const directoryRoot = `${documentationRoot}${this.getDirectoryRoot(classModel)}`;
    const fullClassName = `${Settings.getInstance().getNamespacePrefix()}${classModel.name}`;
    return `[${fullClassName}](${directoryRoot}${this.getIsNgDoc() ? classModel.name : fullClassName})`;
  }

  public static getFileLinkByTypeName(typeName: string) {
    const type = TypesRepository.getInstance().getFromScopedByName(typeName);
    if (!type) {
      // If the type is not found we return a Markdown hyperlink with whatever we received.
        return !this.getIsNgDoc()
          ? `[${typeName}](${typeName})`
          : `[${typeName}](` + ( typeName.indexOf('.') > -1 ? `apex/project_cloud/${typeName.replace(/\.(.*)/, (full, captured) => '#' + captured.toLowerCase())}` : '#' + typeName.toLowerCase() ) + ')';
    }
    return this.getFileLink(type);
  }

  private static getDirectoryRoot(classModel: Type) {
    let sanitizedGroup = this.getSanitizedGroup(classModel);
    sanitizedGroup = sanitizedGroup ? '/' + sanitizedGroup : '';
    // root-relative links start from the root by using a leading '/'
    const generator = Settings.getInstance().targetGenerator;
    if (TypeTranspilerFactory.get(generator).getLinkingStrategy() === 'root-relative') {
      return `${sanitizedGroup}/`;
    }

    // path-relative links traverse the directory structure
    const typeBeingProcessed = State.getInstance().getTypeBeingProcessed();

    if (typeBeingProcessed) {
      if (!this.getIsNgDoc() && this.getClassGroup(typeBeingProcessed) === this.getClassGroup(classModel)) {
        // If the types the same groups then we simply link directly to that file
        return 'apex/project_cloud/';
      } else {
        // If the types have different groups then we have to go up a directory
        return `apex/project_cloud/${sanitizedGroup}`;
      }
    } else {
      // If nothing is being processed then we assume we are at the root and links should include the groups
      return `apex/project_cloud/${sanitizedGroup}`;
    }
  }

  private static getClassGroup(classModel: Type): string {
    const groupAnnotation = classModel.docComment?.annotations.find(
      (annotation) => annotation.name.toLowerCase() === 'group',
    );
    return groupAnnotation?.body ?? Settings.getInstance().getDefaultGroupName();
  }
}

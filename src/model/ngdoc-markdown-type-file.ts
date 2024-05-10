import {
  ClassMirror,
  ConstructorMirror,
  EnumMirror,
  InterfaceMirror,
  MethodMirror,
  Type,
} from '@cparra/apex-reflection';
import { WalkerFactory } from '../service/walkers/walker-factory';
import { WalkerListener } from '../service/walkers/walker';
import { MarkdownFile } from './markdown-file';
import { declareType, declareMethod, declareField } from './markdown-generation-util';
import ClassFileGeneratorHelper from '../transpiler/markdown/class-file-generatorHelper';
import { FieldMirrorWithInheritance, MethodMirrorWithInheritance, PropertyMirrorWithInheritance } from './inheritance';
import { Settings } from '../settings';

interface GroupAware {
  group?: string;
  groupDescription?: string;
}

interface GroupMap {
  [key: string]: GroupAware[];
}

export class NgDocMarkdownTypeFile extends MarkdownFile implements WalkerListener {
  constructor(private type: Type, private headingLevel: number = 1, headerContent?: string, private isInner = false) {
    super('index', `${Settings.getInstance().getNamespacePrefix().replace('.', '/')}${type.name}`);
    if (headerContent) {
      this.addText(headerContent);
    }
    const walker = WalkerFactory.get(type);
    walker.walk(this);
    if (this.isInner) {
      //this.addText('{% endindex %}');
    }
  }

  public onTypeDeclaration(typeMirror: Type): void {
    let fullTypeName;
    if (this.isInner) {
      fullTypeName = typeMirror.name;
    } else {
      fullTypeName = `${typeMirror.name}`;
    }
    this.addTitle(fullTypeName, this.headingLevel);
    if (this.isInner) {
      //this.addBlankLine();
      //this.addText('{% index false %}');
    }
    declareType(this, typeMirror);
  }

  public onConstructorDeclaration(className: string, constructors: ConstructorMirror[]): void {
    this.addText('{% index false %}');
    this.addBlankLine();
    this.addTitle('Constructors', this.headingLevel + 1);
    this.declareMethodWithGroupings(constructors, className);
    this.addText('{% endindex %}');
  }

  public onFieldsDeclaration(fields: FieldMirrorWithInheritance[]): void {
    this.addText('{% index false %}');
    this.addBlankLine();
    this.addTitle('Fields', this.headingLevel + 1);
    this.declareFieldOrProperty(fields);
    this.addText('{% endindex %}');
  }

  public onPropertiesDeclaration(properties: PropertyMirrorWithInheritance[]): void {
    this.addText('{% index false %}');
    this.addBlankLine();
    this.addTitle('Properties', this.headingLevel + 1);
    this.declareFieldOrProperty(properties);
    this.addText('{% endindex %}');
  }

  public onMethodsDeclaration(methods: MethodMirror[]): void {
    this.addText('{% index false %}');
    this.addBlankLine();
    this.addTitle('Methods', this.headingLevel + 1);
    this.declareMethodWithGroupings(methods);
    this.addText('{% endindex %}');
  }

  public onInnerEnumsDeclaration(enums: EnumMirror[]): void {
    this.addText('{% index false %}');
    this.addBlankLine();
    this.addTitle('Methods', this.headingLevel + 1);
    this.addInnerTypes('Enums', enums);
    this.addText('{% endindex %}');
  }

  public onInnerClassesDeclaration(classes: ClassMirror[]): void {
    this.addBlankLine();
    this.addInnerTypes('Classes', classes);
  }

  public onInnerInterfacesDeclaration(interfaces: InterfaceMirror[]): void {
    this.addInnerTypes('Interfaces', interfaces, false);
  }

  private addInnerTypes(title: string, types: Type[], addSeparator = true) {
    this.addTitle(title, this.headingLevel + 1);
    types
      .sort((typeA, typeB) => {
        if (typeA.name < typeB.name) return -1;
        if (typeA.name > typeB.name) return 1;
        return 0;
      })
      .forEach((currentType) => {
        const innerFile = new NgDocMarkdownTypeFile(currentType, this.headingLevel + 2, undefined, true);
        //this.addText('{% index false %}');
        this.addText(innerFile._contents);
        //this.addText('{% endindex %}');
      });
    if (addSeparator) {
      this.addHorizontalRule();
    }
  }

  private hasGroupings(groupAware: GroupAware[]): boolean {
    return !!groupAware.find((current) => !!current.group);
  }

  private declareMethodWithGroupings(
    methods: ConstructorMirror[] | MethodMirrorWithInheritance[],
    className = '',
  ): void {
    const hasGroupings = this.hasGroupings(methods);
    if (!hasGroupings) {
      declareMethod(this, methods, this.headingLevel, className);
    } else {
      const groupedConstructors = this.group(methods);
      for (const key in groupedConstructors) {
        // For the group description, we can take the first one, since they all have the same description.
        this.startGroup(key, groupedConstructors[key][0].groupDescription);
        const constructorsForGroup = groupedConstructors[key] as (ConstructorMirror | MethodMirrorWithInheritance)[];
        declareMethod(this, constructorsForGroup, this.headingLevel, className);
        this.endGroup();
      }
    }
  }

  private declareFieldOrProperty(
    fieldsOrProperties: FieldMirrorWithInheritance[] | PropertyMirrorWithInheritance[],
  ): void {
    const hasGroupings = this.hasGroupings(fieldsOrProperties);
    if (!hasGroupings) {
      declareField(this, fieldsOrProperties, this.headingLevel, false);
    } else {
      const groupedFields = this.group(fieldsOrProperties);
      for (const key in groupedFields) {
        // For the group description, we can take the first one, since they all have the same description.
        this.startGroup(key, groupedFields[key][0].groupDescription);
        const fieldsForGroup = groupedFields[key] as (FieldMirrorWithInheritance | PropertyMirrorWithInheritance)[];
        declareField(this, fieldsForGroup, this.headingLevel, true);
        this.endGroup();
      }
    }
  }

  private startGroup(groupName: string, groupDescription?: string) {
    this.headingLevel = this.headingLevel + 2;
    this.addTitle(groupName, this.headingLevel);
    if (groupDescription) {
      this.addText(groupDescription);
    }
  }

  private endGroup() {
    this.headingLevel = this.headingLevel - 2;
  }

  private group(list: GroupAware[]) {
    return list.reduce((groups: GroupMap, item) => {
      const groupName: string = item.group ?? 'Other';
      const group: GroupAware[] = groups[groupName] || [];
      group.push(item);
      groups[groupName] = group;
      return groups;
    }, {});
  }
}

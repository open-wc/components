export type Template = Record<string, { subject: string; html: string }>[];

export type GrapeEditorBlock = {
  id: string;
  label: string;
  category: string;
  content: string;
  media?: string;
  activate?: boolean;
  select?: boolean;
  attributes?: Record<string, string>;
};

export type ComponentStylePreset = {
  id: string;
  label: string;
  attributes: Record<string, string>;
};

export type ComponentOptions = Record<string, ComponentStylePreset[]>;

export type DefaultStyleAttributesByComponent = Record<string, Record<string, string>>;

export type TemplateRecord = {
  name: string;
  template: Template;
  options?: {
    delays?: number[];
    schema?: import('@jsonforms/core').JsonSchema7;
    uiSchema?: import('@jsonforms/core').ControlElement;
    value?: Record<string, unknown>;
    tag?: string;
    fileList?: { name: string; id: string; url?: string; size?: number }[];
    renderMode?: 'mjml' | 'html';
  };
};

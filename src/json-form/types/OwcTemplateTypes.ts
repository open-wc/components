export type Template = Record<string, { subject: string; html: string }>[];

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

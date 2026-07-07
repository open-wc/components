```js server
export const config = {
  path: '/template-editor',
  title: 'Template Editor',
  menu: {
    parent: 'workflow',
    order: 10,
    linkText: 'Template Editor',
    iconName: 'file-earmark-richtext',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import '@open-wc/components/define/owc-template-editor.js';
import '@open-wc/components/define/owc-compose-email.js';
import { createRef, ref } from 'lit/directives/ref.js';
```

# Templates

A template is a predefined email layout, that may already include content like images or text.
With this feature you can provide templates with optional parameters for the user. Note that you should write the template with old HTML standards. Pay attention to the specific HTML requirements for email.

## Simple template

Use the `templates` property in the `owc-template-editor` web component to add an object with template records.
In its simplest form, a template has a name and a template object that consists of a `subject` and an `html` string.

```js demo
export const simpleTemplate = () => {
  const templates = {
    simpleTemplate: {
      name: 'simpleTemplate',
      template: [
        {
          firstSimpleTemplate: {
            subject: 'My first template',
            html: `<div style="color: blue;">My first template!</div>`,
          },
        },
      ],
    },
  };

  let templateEditor = createRef();
  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  return html`<owc-template-editor ${ref(templateEditor)} .templates=${templates}>
    </owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button> `;
};
```

## Default template

In some cases you want to render a default template instantly for example to
provide some guidelines or corporate identity stuff. To do so call the template
you want to provide "default".

```js demo
export const defaultTemplate = () => {
  const templates = {
    //With the keyword default your template is rendered instantly
    default: {
      name: 'defaultSimpleTemplate',
      template: [
        {
          defaultTemplate: {
            subject: 'Default template',
            html: `<div>header</div>
            <br>
            <div>...add some text<div>
            <br>
            <div>footer</div>`,
          },
        },
      ],
    },
  };

  let templateEditor = createRef();
  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  return html`
    <owc-template-editor ${ref(templateEditor)} .templates=${templates} .showSubject=${true}>
    </owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button>
  `;
};
```

## Template variants: formal and informal

It is possible to store different variants of the same template.
In this example, a formal and informal version of a template are provided.
Create your template variants and add them to the `template` property of your template record.

```js demo
export const formalAndInformalTemplate = () => {
  const formalTemplate = {
    subject: 'Template variant formal',
    html: `<div>Most esteemed Sir,<br> highly honored Madam, 🧐</div>`,
  };

  const informalTemplate = {
    subject: 'Template variant informal',
    html: `<div>Hey there! 🤗</div>`,
  };

  const templates = {
    default: {
      name: 'formalAndinformalVariant',
      template: [{ formal: { ...formalTemplate }, informal: { ...informalTemplate } }],
    },
  };

  let templateEditor = createRef();
  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  return html`
    <owc-template-editor
      ${ref(templateEditor)}
      .templates=${templates}
      .showSubject=${true}
    ></owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button>
  `;
};
```

## Add Options

The `options` property enables your user to modify the content of your template.

### Schema

Gives the user the possibillity to add data to the template dynamically. A Simple
`uiSchema` is required to make a schema visible.

- **`required`:** If it is necessary, that the value is filled in, add the property to the array.
- **`type`:**
- **`properties`:**
  - **`title`:** Visible label of the property in the ui.
  - **`type`:** Define the type of the input field to ensure correct data is passed. An alert is triggered, if a wrong datatype is typed in.
  - **`pattern`:** To prevent errors you can prove the valitity of the entered data by making use of a regular expression. If the input does not fit to the pattern the user gets an alert with feedback.

```js demo
export const templateWithOptions = () => {
  const templates = {
    default: {
      name: 'Schema',
      template: [
        {
          default: {
            subject: 'Schema',
            html: `<div>{template.url}</div>`,
          },
        },
      ],
      options: {
        schema: {
          required: ['url'],
          type: 'object',
          properties: {
            url: {
              title: 'url',
              type: 'string',
              pattern:
                '^(https?://)?((([a-zA-Z0-9-]+.)+[a-zA-Z]{2,})|((d{1,3}.){3}d{1,3}))(:d+)?(/[^s]*)?$',
            },
          },
        },
        uiSchema: {
          // @ts-ignore
          type: 'Control',
          scope: '#/properties/url',
        },
      },
    },
  };

  let templateEditor = createRef();
  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  return html`
    <owc-template-editor ${ref(templateEditor)} .templates=${templates} .showSubject=${true}>
    </owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button>
  `;
};
```

### uiSchema

Except for making one property visible, it's possible to arrange a group of properties. For further
information, go to <a href="/json-form">Json-form</a>.

- **`type`:** Choose how you want to render your properties (VerticalLayout, HorizontalLayout, GroupLayout, CheckboxComboLayout).
- **`elements`:** Match UI elements with a property from the schema
  - **`type`:** `'Control'`
  - **`scope`:** To match a control with a property write `#/properties/\<NameOfProperty>`

```js demo
export const uiSchema = () => {
  const selectedUser = {
    user1: { name: 'Akira Suzuki', id: 1 },
    user2: { name: 'Isolde Frostbane', id: 2 },
    user3: { name: 'Omar Khaled', id: 3 },
  };

  const templates = {
    default: {
      name: 'Template VerticalLayout uiSchema',
      template: [
        {
          default: {
            subject: 'VerticalLayout uiSchema',
            html: `<div>This options have an vertical layout</div>
            <div>{template.url}</div>
            <div>{template.selectedUser}</div>`,
          },
        },
      ],
      options: {
        schema: {
          required: ['selectedUser', 'url'],
          type: 'object',
          properties: {
            selectedUser: {
              title: 'selectedUser',
              type: 'number',
              oneOf: Object.keys(selectedUser).map(key => ({
                const: selectedUser[key].id,
                title: selectedUser[key].name,
              })),
            },
            url: {
              title: 'url',
              type: 'string',
              pattern:
                '^(https?://)?((([a-zA-Z0-9-]+.)+[a-zA-Z]{2,})|((d{1,3}.){3}d{1,3}))(:d+)?(/[^s]*)?$',
            },
          },
        },
        uiSchema: {
          // FIXME: Custom schema typing
          // @ts-ignore
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/selectedUser',
            },
            {
              type: 'Control',
              scope: '#/properties/url',
            },
          ],
        },
      },
    },
  };

  let templateEditor = createRef();

  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  return html`
    <owc-template-editor
      ${ref(templateEditor)}
      .templates=${templates}
      .showSubject=${true}
    ></owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button>
  `;
};
```

### Tag

Allocate the `tag` property to `options` to a template to control its behavior in further steps.

```js demo
export const multiTemplates = () => {
  const templates = {
    simpleTemplate: {
      name: 'simpleTemplate',
      template: [
        {
          firstSimpleTemplate: {
            subject: 'My first template',
            html: `<div></div>`,
          },
        },
      ],
    },
    options: {
      tag: 'internTemplate',
    },
  };

  const tagValue = templates.options.tag;

  let templateEditor = createRef();
  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  return html`
    <div>
      ${
        tagValue === 'internTemplate'
          ? html`<p style="color: red; ">This template is for intern use only!</p>`
          : ''
      }
    </div>
    <owc-template-editor
      ${ref(templateEditor)}
      .templates=${templates}
      .showSubject=${true}
    ></owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button>
  `;
};
```

## Multitemplates

If you need a sequence of emails for some reason, such as leading a campaign, you can implement it with the multi-template attribute.

### Delays

The `options` property, as you already know, holds a `delays` property—an array of numbers—that gives you the possibility to control the time lag between the messages.

```js demo
export const tags = () => {
  const templates = {
    template1: {
      name: 'Template: 🥚🐣🐥',
      template: [
        {
          default: {
            subject: '🥚',
            html: `<div">Part ONE: 🥚</div>`,
          },
        },
        {
          TWO: {
            subject: '🐣',
            html: `<div">Part TWO: 🐣</div>`,
          },
        },
        {
          THREE: {
            subject: '🐥',
            html: `<div">Part THREE: 🐥</div>`,
          },
        },
      ],
    },
    options: {
      delays: [1, 1],
    },
  };

  let templateEditor = createRef();
  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  //Add multi-template attribute
  return html`
    <owc-template-editor
      ${ref(templateEditor)}
      .previewMode=${false}
      .enableMultiTemplate=${true}
      .templates=${templates}
    ></owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button>
  `;
};
```

## Markup

As the editor uses editable html, everything directly written in the textbox is interpreted as text. To still be able to use common hypertext functionality we parse the following common markup syntax features.

### Hyperlinks

```js demo
export const hyperLinks = () => {
  const selectedUser = {
    user1: { name: 'Akira Suzuki', id: 1 },
    user2: { name: 'Isolde Frostbane', id: 2 },
    user3: { name: 'Omar Khaled', id: 3 },
  };

  const templates = {
    default: {
      name: 'default',
      template: [
        {
          default: {
            subject: 'hyperlinks',
            html: `<div style="color: blue;">[link href="https://www.google.com"]Foobar[/link]</div>`,
          },
        },
      ],
    },
  };

  let templateEditor = createRef();

  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  return html`
    <owc-template-editor
      ${ref(templateEditor)}
      .templates=${templates}
      .showSubject=${true}
    ></owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button>
  `;
};
```

You can also use wrap html with the hyperlink markup.

```js demo
export const hyperLinksHtml = () => {
  const selectedUser = {
    user1: { name: 'Akira Suzuki', id: 1 },
    user2: { name: 'Isolde Frostbane', id: 2 },
    user3: { name: 'Omar Khaled', id: 3 },
  };

  const templates = {
    default: {
      name: 'default',
      template: [
        {
          default: {
            subject: 'hyperlinks',
            html: `<div>[link href="https://www.google.com"]
            <img width=200 src="https://static1.squarespace.com/static/607f89e638219e13eee71b1e/60a5de2d343ab05906685029/646c549369f8011c28cd5843/1684821591871/michael-sum-LEpfefQf4rU-unsplash.jpg?format=1500w">
            [/link]</div>`,
          },
        },
      ],
    },
  };

  let templateEditor = createRef();

  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  return html`
    <owc-template-editor
      ${ref(templateEditor)}
      .templates=${templates}
      .showSubject=${true}
    ></owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button>
  `;
};
```

You can also use variables in hyperlinks.

```js demo
export const hyperLinksVariable = () => {
  const templates = {
    default: {
      name: 'default',
      template: [
        {
          default: {
            subject: 'hyperlinks',
            html: `<div>[link href="https://www.{template.host}.com"]
            foobar
            [/link]</div>`,
          },
        },
      ],
      options: {
        schema: {
          required: ['host'],
          type: 'object',
          properties: {
            host: {
              title: 'host',
              type: 'string',
            },
          },
        },
        uiSchema: {
          // @ts-ignore
          type: 'Control',
          scope: '#/properties/host',
        },
        value: {
          host: 'google',
        },
      },
    },
  };

  let templateEditor = createRef();

  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  return html`
    <owc-template-editor
      ${ref(templateEditor)}
      .templates=${templates}
      .showSubject=${true}
    ></owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button>
  `;
};
```

## File Upload

You can implement attachments by using the integrated file upload field. You can display it by setting the `showFileUpload` property to true.
Note: `showSubject` must also be true for the fileUpload to show.

By setting the `renderFileContent` property to a function returning html you can change how the uploaded files look. The returned content can be any valid innerHmtl of the OwcCard component. See [OwcCard](/card) for more information.

On it's own the file upload does not do much. You can however add an uploadHandler which has the a of new files a list of all files and the function to insert text at the current caret location as parameters. The upload handler also gets passed a `requestUpdate` function parameter. Use this if you make any updates to the passed files which would change the output of the `renderFileContent` function.

In this example we insert the current file name at the caret when a file is input.

```js demo
export const fileUpload = () => {
  const templates = {
    default: {
      name: 'defaultSimpleTemplate',
      template: [
        {
          defaultTemplate: {
            subject: 'Default template',
            html: `<div>header</div>
            <br>
            <div>...add some text<div>
            <br>
            <div>footer</div>`,
          },
        },
      ],
    },
  };

  let templateEditor = createRef();
  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  function handleFileUpload({ allFiles, newFiles, insertTextAtCaret, requestUpdate }) {
    insertTextAtCaret(newFiles.map(file => file.name).join(' '));
  }

  function renderFileContent(file, deleteFile) {
    return html`
      <span slot="header"
        >${file.name} <button @click=${() => deleteFile(file)}>Remove</button></span
      >
      Size: ${file.size}
    `;
  }

  return html`
    <owc-template-editor
      ${ref(templateEditor)}
      .templates=${templates}
      .showSubject=${true}
      .showFileUpload=${true}
      .handleFileUpload=${handleFileUpload}
      .renderFileContent=${renderFileContent}
    >
    </owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button>
  `;

  `${file.name}
      <owc-icon-button @click=${() => removeFile(file)} name="x"></owc-icon-button><br />
      ${
        file.url
          ? html`<a href=${file.url}>Link</a
              ><wa-copy-button value=${file.url}>Download link kopieren</wa-copy-button>`
          : html`<wa-spinner></wa-spinner>`
      } `;
};
```

## Extra options

### Help Button

You can display a help button showing a summary of the markup options when clicked, by setting the `showTemplateButton` property to true.

```js demo
export const helpButton = () => {
  const templates = {
    simpleTemplate: {
      name: 'simpleTemplate',
      template: [
        {
          firstSimpleTemplate: {
            subject: 'My first template',
            html: `<div style="color: blue;">My first template!</div>`,
          },
        },
      ],
    },
  };

  let templateEditor = createRef();
  function handleClick() {
    templateEditor.value.togglePreviewMode();
  }

  return html`<owc-template-editor
      ${ref(templateEditor)}
      .templates=${templates}
      .showHelpButton=${true}
    >
    </owc-template-editor>
    <br />
    <button @click="${handleClick}" id="validate-button">Validate</button> `;
};
```

## API (owc-template-editor)

`<owc-template-editor>` is the orchestrator: it renders either the classic editor
(`owc-template-editor-old`, textarea-based - the default) or the visual GrapesJS/MJML editor
(`owc-template-editor-new`) and forwards its full configuration to whichever is active. The
"Neuer Editor" switch (hide via `show-editor-switch`/`showEditorSwitch = false`) toggles
between them at runtime.

### Key attributes & properties

| Property                                                                                       | Description                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `templates`                                                                                    | `Record<string, TemplateRecord>` - the selectable templates (see `OwcTemplateEditorTypes`). |
| `useNewEditor`                                                                                 | Starts with the GrapesJS editor instead of the classic one.                                 |
| `previewMode`, `previewData`, `previewDataParameter`                                           | Preview rendering with resolved `{client.*}`/`{user.*}`/`{default.*}` variables.            |
| `showSubject`, `subject`                                                                       | Subject line editing.                                                                       |
| `tags`, `showEmailTagSelection`                                                                | Email tag selection (renders `owc-email-tag-radio-group`).                                  |
| `textModuleOptions`                                                                            | Insertable text modules.                                                                    |
| `postProcessor`                                                                                | `(html, recipient) => string` applied after variable replacement.                           |
| `enableMultiTemplate`, `showMultiTemplateButtons`, `currentIndex`                              | Multi-step template sequences.                                                              |
| `grapeEditorBlocks`, `defaultStyling`, `defaultStyleAttributesByComponent`, `componentOptions` | GrapesJS-editor configuration.                                                              |
| `showFileUpload`, `handleFileUpload`, `renderFileContent`                                      | Attachment handling.                                                                        |

### Methods & read-only properties

| Member                                                  | Description                                                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `generateValueForData(data, dataParameter, options?)`   | `{subject, html}` with variables resolved (delegates to the shared `generateValueForData` helper); MJML templates are compiled. |
| `currentTemplateRecord`                                 | The selected template record (get/set, delegated to the inner editor).                                                          |
| `validate()` / `valid`                                  | Validates the template's JSON-schema options form.                                                                              |
| `getCurrentTemplate()` / `templateData` / `markSaved()` | Inner-editor passthroughs.                                                                                                      |

Events from the inner editor (`templateUpdate`, `tag-change`) are re-dispatched on the host.

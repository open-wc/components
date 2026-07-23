```js server
export const config = {
  path: '/workflow/compose-email',
  title: 'Compose Email',
  menu: {
    parent: '/workflow',
    order: 20,
    iconName: 'envelope',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-compose-email.js';
```

# Compose Email

An email editor that makes it easy to send emails to many users simultaneously using templates and variables.

Simple example:

The `.recipientList` attribute is the recipients list and the `.user` attribute is the sender. Both require at least an `email` property and recipients also require an `id`.

```js demo
export const simpleCompose = () => {
  return html`
    <owc-compose-email
      .recipientList=${[
        { id: 1, email: 'ada.lovelace@example.com' },
        { id: 2, email: 'grace.hopper@example.com' },
      ]}
      .user=${{ email: 'alex.taylor@example.com' }}
    >
    </owc-compose-email>
  `;
};
```

## Send and Draft

Use the `.sendMail` attribute to control what happens when the send or draft button is pressed. In this example the send button logs a list of all generated emails using the `generateMailFromTo` function.

```js demo
export const sendComposedEmail = () => {
  return html`
    <owc-compose-email
      .recipientList=${[
        { id: 1, email: 'ada.lovelace@example.com' },
        { id: 2, email: 'grace.hopper@example.com' },
      ]}
      .user=${{ email: 'alex.taylor@example.com' }}
      .sendMail=${({ recipientList, generateMailFromTo, draft, sendDate }) => {
        if (draft) {
          console.log('Draft Saved!');
        } else {
          console.log(
            recipientList.map(to => {
              const updatedTo = generateMailFromTo(to);
              return { ...updatedTo, sendDate };
            }),
          );
        }
      }}
      .draft
    >
    </owc-compose-email>
  `;
};
```

## Variables

With variables, data from `.recipientList` (`client`), `.user` (`user`) or `.defaultVariables` (`default`) can be inserted as text and will dynamically change, depending on the recipient. These variables can be inserted with the syntax: `{client|user|default.property}`. Use the Preview button to render a preview for every recipient. The `.textModuleOptions` attribute adds a menu to insert variables that are labeled.

```js demo
export const variablesCompose = () => {
  return html`
    <owc-compose-email
      .recipientList=${[
        { id: 1, firstName: 'Ada', lastName: 'Lovelace', email: 'ada.lovelace@example.com' },
        { id: 2, firstName: 'Grace', lastName: 'Hopper', email: 'grace.hopper@example.com' },
      ]}
      .user=${{ firstName: 'Alex', lastName: 'Taylor', email: 'alex.taylor@example.com' }}
      .defaultVariables=${{
        signature: 'This is a signature',
      }}
      .textModuleOptions=${[
        { label: 'First Name', value: 'client.firstName' },
        { label: 'User', value: 'user.firstName' },
        { label: 'Signature', value: 'default.signature' },
      ]}
    >
    </owc-compose-email>
  `;
};
```

## Templates

Use the `.templates` attribute to create templates for emails. Templates can use variables and be formatted with HTML (Note that you should write the template with old HTML standards. Pay attention to the specific HTML requirements for email.). See the Owc Template Editor for more information and options on templates. Use `.selectVariant` to use templates with multiple variants, that change depending on a property of a client.

```js demo
export const templateCompose = () => {
  return html`
    <owc-compose-email
      .recipientList=${[
        {
          id: 1,
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada.lovelace@example.com',
          formal: true,
        },
        {
          id: 2,
          firstName: 'Grace',
          lastName: 'Hopper',
          email: 'grace.hopper@example.com',
          formal: false,
        },
        {
          id: 3,
          firstName: 'Stefan',
          lastName: 'Test',
          email: 'sam.rivera@example.com',
          formal: true,
        },
      ]}
      .user=${{ name: 'Alex Taylor', email: 'alex.taylor@example.com' }}
      .selectVariant=${(data, options) => {
        if (options.includes('formal') && options.includes('informal')) {
          return data.client.formal === true ? 'formal' : 'informal';
        } else if (options.includes('formal')) {
          return 'formal';
        } else if (options.includes('informal')) {
          return 'informal';
        } else {
          return options[0];
        }
      }}
      .templates=${{
        default: {
          name: 'Default',
          template: [
            {
              default: {
                subject: '',
                html: `Dear {client.firstName} {client.lastName},<br/><br/><br/><br/>Regards,<br/>{user.name}`,
              },
            },
          ],
        },
        template1: {
          name: 'Reminder',
          template: [
            {
              default: {
                subject: '',
                html: `
                <div style="background-color:#000080;color:white;text-align:center;"><b>Dear {client.firstName} {client.lastName},</b> <br/><br/>
                This is a reminder that Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.<br/><br/>
                Regards,<br/><i>{user.name}</i></div>`,
              },
            },
          ],
        },
        template2: {
          name: 'Variants',
          template: [
            {
              informal: {
                subject: '',
                html: `Hi {client.firstName},<br/><br/><br/><br/>Regards,<br/>{user.name}`,
              },
              formal: {
                subject: '',
                html: `Dear {client.firstName} {client.lastName},<br/><br/><br/><br/>Sincerely,<br/>{user.name}`,
              },
            },
          ],
        },
      }}
    >
    </owc-compose-email>
  `;
};
```

## Default client for preview

Use the `.previewIndex` attribute to set the default user that is selected when in preview mode. In this example it is the fourth user.

```js demo
export const previewIndexCompose = () => {
  return html`
    <owc-compose-email
      .recipientList=${[
        { id: 1, email: 'ada.lovelace@example.com' },
        { id: 2, email: 'grace.hopper@example.com' },
        { id: 3, email: 'john.doe@example.com' },
        { id: 4, email: 'jane.doe@example.com' },
        { id: 5, email: 'alex.smith@example.com' },
      ]}
      .user=${{ email: 'alex.taylor@example.com' }}
      .previewIndex=${3}
    >
    </owc-compose-email>
  `;
};
```

## Toggle preview mode externally

To change to preview mode call a function that sets `.previewMode` to `true`. In this example there is a button that toggles the preview mode through an event handler.

```js demo
export const previewModeCompose = () => {
  return html`
    <owc-compose-email
      .recipientList=${[
        { id: 1, email: 'ada.lovelace@example.com' },
        { id: 2, email: 'grace.hopper@example.com' },
      ]}
      .user=${{ email: 'alex.taylor@example.com' }}
    >
    </owc-compose-email>
    <wa-button
      variant="brand"
      style="margin-top: 15px"
      size="large"
      @click=${() => {
        const openPreview = document
          .querySelector('[demo-name=previewModeCompose]')
          ?.shadowRoot?.querySelector('owc-compose-email');
        if (openPreview) {
          openPreview.previewMode
            ? (openPreview.previewMode = false)
            : (openPreview.previewMode = true);
        }
      }}
      >Toggle Preview Mode!</wa-button
    >
  `;
};
```

## Add unsubscribe text

Use the `.addUnsubscribe` attribute to add static text to the end of every email, like an option to unsubscribe from a news letter. Go into preview mode to preview the added text.

```js demo
export const unsubscribeCompose = () => {
  return html`
    <owc-compose-email
      .recipientList=${[
        { id: 1, email: 'ada.lovelace@example.com' },
        { id: 2, email: 'grace.hopper@example.com' },
      ]}
      .user=${{ email: 'alex.taylor@example.com' }}
      .addUnsubscribe=${input => {
        return `
          ${input}
          <br/>
          Unsubscribe <br/>
          If you no longer wish to receive these emails you may <a href="https://example.com">unsubscribe</a>.
        `;
      }}
    >
    </owc-compose-email>
  `;
};
```

## Disable send and draft

Set `.allowSendActions` to `false` to disable the send and draft buttons.

```js demo
export const draftInfoCompose = () => {
  return html`
    <owc-compose-email
      .recipientList=${[
        { id: 1, email: 'ada.lovelace@example.com' },
        { id: 2, email: 'grace.hopper@example.com' },
      ]}
      .user=${{ email: 'alex.taylor@example.com' }}
      .allowSendActions=${false}
    >
    </owc-compose-email>
  `;
};
```

## Tags

Use the `.tags` attribute to display a menu where you can assign different tags to emails. Recipients that don't have the corresponding tag in their `tagList` are marked red and won't receive the email.

```js demo
export const tagsCompose = () => {
  return html`
    <owc-compose-email
      .recipientList=${[
        {
          id: 1,
          tagList: ['newsWeekly', 'newsMonthly', 'discount', 'policy'],
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada.lovelace@example.com',
        },
        {
          id: 2,
          tagList: ['discount', 'policy'],
          firstName: 'Grace',
          lastName: 'Hopper',
          email: 'grace.hopper@example.com',
        },
        {
          id: 3,
          tagList: ['policy'],
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
      ]}
      .user=${{ name: 'Alex Taylor', email: 'alex.taylor@example.com' }}
      .tags=${[
        { label: 'Newsletter (Weekly)', value: 'newsWeekly' },
        { label: 'Newsletter (Monthly)', value: 'newsMonthly' },
        { label: 'Special Discounts', value: 'discount' },
        { label: 'Policy Update', value: 'policy' },
      ]}
    >
    </owc-compose-email>
  `;
};
```

## Recipient list formatter

Use the `.emailFormatter` to write a custom formatter for the recipients list. In this example the email is replaced with the first and last name.

```js demo
export const formatterCompose = () => {
  return html`
    <owc-compose-email
      .recipientList=${[
        { id: 1, firstName: 'Ada', lastName: 'Lovelace', email: 'ada.lovelace@example.com' },
        { id: 2, firstName: 'Grace', lastName: 'Hopper', email: 'grace.hopper@example.com' },
      ]}
      .user=${{ email: 'alex.taylor@example.com' }}
      .emailFormatter=${({ recipient, good, remove }) => html`
        <wa-tag
          size="medium"
          removable
          @wa-remove=${remove}
          class="recipient"
          variant=${good ? 'neutral' : 'danger'}
        >
          ${recipient.firstName} ${recipient.lastName}
        </wa-tag>
      `}
    >
    </owc-compose-email>
  `;
};
```

## File Upload

See [OwcTemplateEditor](/template-editor#file-upload), properties are drilled without change.

## API

### Attributes & properties (main surface)

| Property                                                                                                                                                                                                                                  | Type                                                                                  | Default       | Description                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `recipientList`                                                                                                                                                                                                                           | `T[]`                                                                                 | `[]`          | The recipients; each needs `id`, `email`, `user.email`, optionally `tagList`.                                              |
| `recipientIsGood`                                                                                                                                                                                                                         | `(recipient) => {good, reason?}`                                                      | all good      | External per-recipient check (bounces, opt-outs, ...); bad recipients render as danger tags and are excluded from sending. |
| `formatterMode`                                                                                                                                                                                                                           | `'short' \| 'long' \| '<n>auto'`                                                      | `'500auto'`   | Collapses the recipient tags to a summary - always, never, or from `n` recipients.                                         |
| `emailFormatter` / `shortEmailFormatter`                                                                                                                                                                                                  | `function`                                                                            | tag / summary | Custom renderers for the recipient list.                                                                                   |
| `templates`, `grapeEditorBlocks`, `defaultStyling`, `defaultStyleAttributesByComponent`, `componentOptions`, `textModuleOptions`, `tags`, `showEditorSwitch`, `showFileUpload`, `handleFileUpload`, `renderFileContent`, `showHelpButton` |                                                                                       |               | Forwarded to the inner [`owc-template-editor`](/template-editor/).                                                         |
| `defaultVariables`                                                                                                                                                                                                                        | `Record<string, string \| (recipient) => string>`                                     | `{}`          | Available as `{default.*}` in templates.                                                                                   |
| `sendMail`                                                                                                                                                                                                                                | `async ({draft, recipientList, generateMailFromTo, sendDate, currentTemplateRecord})` | success stub  | Your transport; called by the draft/send buttons after validation.                                                         |
| `afterSend`                                                                                                                                                                                                                               | `(result) => void`                                                                    | noop          | Called with `sendMail`'s result; the buttons are locked for 2s.                                                            |
| `addUnsubscribe`                                                                                                                                                                                                                          | `(html, recipient, currentTag?) => string`                                            | identity      | Post-processor, e.g. to append an unsubscribe footer.                                                                      |
| `sendDate`                                                                                                                                                                                                                                | `Date`                                                                                | -             | Scheduled send date (set via the date picker; past dates are rejected).                                                    |
| `previewMode` / `previewIndex`                                                                                                                                                                                                            | `boolean` / `number`                                                                  | `false` / `0` | Preview state; `nextPreview()`/`previousPreview()` cycle through the good recipients.                                      |
| `extraActions`                                                                                                                                                                                                                            | `(recipientListGood) => TemplateResult`                                               | empty         | Extra buttons next to send.                                                                                                |

### Read-only properties

| Property                                 | Description                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `recipientListGood`                      | Recipients passing `recipientIsGood` and the template's tag filter (cached per update). |
| `value`                                  | `{ template, recipients }` of the current state.                                        |
| `valueList`                              | Per-recipient `{email, subject, body}` with variables resolved.                         |
| `currentTemplateRecord` / `templateData` | Forwarded from the inner editor.                                                        |

With a template tag active, recipients without that tag in their `tagList` are excluded as
"Hat kein Interesse an dieser E-Mail" - a failing `recipientIsGood` always wins.

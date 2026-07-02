```js server
export const config = {
  path: '/components/compose-email',
  title: 'Compose Email',
  menu: {
    order: 30,
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@finum/data-table/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@finum/data-table/define/owc-compose-email.js';
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
        { id: 1, email: 'max.mustermann@mail.com' },
        { id: 2, email: 'susi-mustermann@mail.com' },
      ]}
      .user=${{ email: 'petermüller@mail.com' }}
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
        { id: 1, email: 'max.mustermann@mail.com' },
        { id: 2, email: 'susi-mustermann@mail.com' },
      ]}
      .user=${{ email: 'petermüller@mail.com' }}
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
        { id: 1, firstName: 'Max', lastName: 'Mustermann', email: 'max.mustermann@mail.com' },
        { id: 2, firstName: 'Susi', lastName: 'Musterfrau', email: 'susi-mustermann@mail.com' },
      ]}
      .user=${{ firstName: 'Peter', lastName: 'Müller', email: 'petermüller@mail.com' }}
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
          firstName: 'Max',
          lastName: 'Mustermann',
          email: 'max.mustermann@mail.com',
          formal: true,
        },
        {
          id: 2,
          firstName: 'Susi',
          lastName: 'Musterfrau',
          email: 'susi-mustermann@mail.com',
          formal: false,
        },
        {
          id: 3,
          firstName: 'Stefan',
          lastName: 'Test',
          email: 'stefan123@mail.com',
          formal: true,
        },
      ]}
      .user=${{ name: 'Peter Müller', email: 'peter.müller@mail.com' }}
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
        { id: 1, email: 'max.mustermann@mail.com' },
        { id: 2, email: 'susi.mustermann@mail.com' },
        { id: 3, email: 'john.doe@mail.com' },
        { id: 4, email: 'jane.doe@mail.com' },
        { id: 5, email: 'alex.smith@mail.com' },
      ]}
      .user=${{ email: 'petermüller@mail.com' }}
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
        { id: 1, email: 'max.mustermann@mail.com' },
        { id: 2, email: 'susi.mustermann@mail.com' },
      ]}
      .user=${{ email: 'petermüller@mail.com' }}
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
        { id: 1, email: 'max.mustermann@mail.com' },
        { id: 2, email: 'susi.mustermann@mail.com' },
      ]}
      .user=${{ email: 'petermüller@mail.com' }}
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
        { id: 1, email: 'max.mustermann@mail.com' },
        { id: 2, email: 'susi.mustermann@mail.com' },
      ]}
      .user=${{ email: 'petermüller@mail.com' }}
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
          firstName: 'Max',
          lastName: 'Mustermann',
          email: 'max.mustermann@mail.com',
        },
        {
          id: 2,
          tagList: ['discount', 'policy'],
          firstName: 'Susi',
          lastName: 'Musterfrau',
          email: 'susi-mustermann@mail.com',
        },
        {
          id: 3,
          tagList: ['policy'],
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@mail.com',
        },
      ]}
      .user=${{ name: 'Peter Müller', email: 'petermüller@mail.com' }}
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
        { id: 1, firstName: 'Max', lastName: 'Mustermann', email: 'max.mustermann@mail.com' },
        { id: 2, firstName: 'Susi', lastName: 'Musterfrau', email: 'susi-mustermann@mail.com' },
      ]}
      .user=${{ email: 'petermüller@mail.com' }}
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

See [OwcTemplateEditor](/components/template-editor#file-upload), properties are drilled without change.

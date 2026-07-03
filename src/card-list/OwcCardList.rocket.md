```js server
export const config = {
  path: '/components/card-list',
  title: 'Card List',
  menu: {
    order: 30,
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-card-list.js';
```

# Card List

A list of owc-cards displayed in a row.

Simple example:

Each card will display data based on the provided `.fields` and `.data` arrays. The `header`, `body`, and `footer` fields define what data is displayed where and the `.data` attribute defines the content for all cards.

```js demo
export const simpleCardList = () => {
  return html`
    <owc-card-list
      .fields=${{
        header: row => html`${row.firstName}`,
        body: row => html`Meeting: ${row.subject}`,
        footer: row => html`Lorem Ipsum dolor`,
      }}
      .data=${[
        {
          firstName: 'Robert Chen',
          subject: 'Meeting with Michael, Lorem Ipsum dolor',
        },
        {
          firstName: 'Michael Doe',
          subject: 'Meeting with Robert, Lorem Ipsum dolor',
        },
        {
          firstName: 'John Doe',
          subject: 'Meeting with Manager, Lorem Ipsum dolor',
        },
      ]}
    ></owc-card-list>
  `;
};
```

## Card list with title

The `.title` attribute is used to specify the title for the list.

```js demo
export const cardListTitle = () => {
  return html`
    <owc-card-list
      .fields=${{
        header: row => html`${row.firstName}`,
        body: row => html`Meeting: ${row.subject}`,
      }}
      .data=${[
        {
          firstName: 'Robert Chen',
          subject: 'Meeting with Michael, Lorem Ipsum dolor',
        },
        {
          firstName: 'Michael Doe',
          subject: 'Meeting with Robert, Lorem Ipsum dolor',
        },
        {
          firstName: 'John Doe',
          subject: 'Meeting with Manager, Lorem Ipsum dolor',
        },
      ]}
      .title=${'Title text'}
    ></owc-card-list>
  `;
};
```

## Card list with view all link

The `.viewAllUrl` attribute specifies the URL that will be navigated to when the "View All" link is clicked.

```js demo
export const cardListViewAll = () => {
  return html`
    <owc-card-list
      .fields=${{
        header: row => html`${row.firstName}`,
        body: row => html`Meeting: ${row.subject}`,
      }}
      .data=${[
        {
          firstName: 'Robert Chen',
          subject: 'Meeting with Michael, Lorem Ipsum dolor',
        },
        {
          firstName: 'Michael Doe',
          subject: 'Meeting with Robert, Lorem Ipsum dolor',
        },
        {
          firstName: 'John Doe',
          subject: 'Meeting with Manager, Lorem Ipsum dolor',
        },
      ]}
      .viewAllUrl=${'https://www.example.com'}
    ></owc-card-list>
  `;
};
```

## Card list with sorter

With the `.sorter` attribute a sorter can be added that sorts the cards in a custom order.

```js demo
export const cardListSorter = () => {
  return html`
    <owc-card-list
      .fields=${{
        header: row => html`${row.firstName}`,
        body: row => html`Meeting Date: ${row.meetingDate.toLocaleDateString()}`,
      }}
      .data=${[
        {
          firstName: 'Robert Chen',
          meetingDate: new Date('2022-06-28T14:30:00.000Z'),
        },
        {
          firstName: 'Michael Doe',
          meetingDate: new Date('2022-05-28T14:30:00.000Z'),
        },
        {
          firstName: 'John Doe',
          meetingDate: new Date('2023-03-28T14:30:00.000Z'),
        },
      ]}
      .sorter=${(a, b) => a.meetingDate - b.meetingDate}
    ></owc-card-list>
  `;
};
```

## Card list with images

With the `.image` attribute images can be added to the cards. `.image` has to be an object with a `src` and `alt` string.

```js demo
export const cardImages = () => {
  return html`
    <owc-card-list
      .fields=${{
        header: row => html`${row.firstName}`,
        body: row => html`${row.subject}`,
        image: {
          src: row => row.image,
          alt: row => row.alt,
        },
      }}
      .data=${[
        {
          firstName: 'Robert Cat',
          image: 'https://loremflickr.com/320/240/cat',
          subject: 'A random small picture related to a cat',
          alt: 'A random small picture related to a cat',
        },
        {
          firstName: 'Michael Dog',
          image: 'https://loremflickr.com/320/240/dog',
          subject: 'A random small picture related to a dog',
          alt: 'A random small picture related to a dog',
        },
        {
          firstName: 'John Pork',
          image: 'https://loremflickr.com/320/240/pig',
          subject: 'A random small picture related to a pig',
          alt: 'A random small picture related to a pig',
        },
      ]}
    ></owc-card-list>
  `;
};
```

## Card list with links

With the `.getRowLinkSettings` attribute links can be added to the cards. `.getCardLinkSettings` has to be a function with `href` and `target`.

```js demo
export const cardLink = () => {
  return html`
    <owc-card-list
      .fields=${{
        header: row => html`${row.firstName}`,
        body: row => html`Meeting: ${row.subject}`,
        footer: row => html`Lorem Ipsum dolor`,
      }}
      .data=${[
        {
          firstName: 'Robert Chen',
          subject: 'Meeting with Michael, Lorem Ipsum dolor',
        },
        {
          firstName: 'Michael Doe',
          subject: 'Meeting with Robert, Lorem Ipsum dolor',
        },
        {
          firstName: 'John Doe',
          subject: 'Meeting with Manager, Lorem Ipsum dolor',
        },
      ]}
      .getCardLinkSettings=${card => ({
        href: `/meetings/${card.firstName}`,
        target: '_blank',
      })}
    ></owc-card-list>
  `;
};
```

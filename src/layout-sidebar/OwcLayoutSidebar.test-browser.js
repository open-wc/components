import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcLayoutSidebar } from './OwcLayoutSidebar.js';

customElements.define('owc-layout-sidebar', OwcLayoutSidebar);

/**
 * @param {OwcLayoutSidebar} el
 */
function menuLinks(el) {
  return [...el.shadowRoot.querySelectorAll('#top a')];
}

describe('owc-layout-sidebar', () => {
  it('renders menu items as links with icons and GET params', async () => {
    const el = await fixture(
      html`<owc-layout-sidebar
        .menuItemList=${[
          { label: 'Home', href: '/home', icon: 'house' },
          { label: 'Contracts', href: '/contracts', hrefGETParams: { state: 'active' } },
        ]}
      ></owc-layout-sidebar>`,
    );
    const links = menuLinks(el);
    expect(links.length).to.equal(2);
    expect(links[0].getAttribute('href')).to.equal('/home');
    expect(links[0].querySelector('wa-icon').getAttribute('name')).to.equal('house');
    expect(links[1].getAttribute('href')).to.equal('/contracts?state=active');
  });

  it('hides items with visible: false', async () => {
    const el = await fixture(
      html`<owc-layout-sidebar
        .menuItemList=${[
          { label: 'Shown', href: '/a' },
          { label: 'Hidden', href: '/b', visible: false },
        ]}
      ></owc-layout-sidebar>`,
    );
    expect(menuLinks(el).length).to.equal(1);
    expect(menuLinks(el)[0].textContent).to.contain('Shown');
  });

  it('renders submenus in a details element, open when flagged', async () => {
    const el = await fixture(
      html`<owc-layout-sidebar
        .menuItemList=${[
          {
            label: 'Group',
            open: true,
            subMenuItemList: [{ label: 'Child', href: '/child' }],
          },
        ]}
      ></owc-layout-sidebar>`,
    );
    const details = el.shadowRoot.querySelector('#top wa-details');
    expect(details).to.exist;
    expect(details.hasAttribute('open')).to.equal(true);
    expect(details.querySelector('a').getAttribute('href')).to.equal('/child');
  });

  it('animates a group open when its rail item expands the sidebar', async () => {
    const group = {
      label: 'Group',
      icon: 'folder',
      subMenuItemList: [{ label: 'Child', href: '/child' }],
    };
    const el = await fixture(
      html`<owc-layout-sidebar .collapsed=${true} .menuItemList=${[group]}> </owc-layout-sidebar>`,
    );
    const showEvent = oneEvent(el, 'wa-show');

    el.shadowRoot.querySelector('.rail-item.has-children').click();
    await showEvent;

    const details = el.shadowRoot.querySelector('#top wa-details');
    expect(el.collapsed).to.equal(false);
    expect(group.open).to.equal(true);
    expect(details.open).to.equal(true);
  });

  it('marks the item matching the current URL as selected and opens its parents', async () => {
    const currentHref = `${location.pathname}${location.search}`;
    const child = { label: 'Current', href: currentHref };
    const parent = { label: 'Group', subMenuItemList: [child] };
    const el = await fixture(
      html`<owc-layout-sidebar .menuItemList=${[parent, { label: 'Other', href: '/other' }]}>
      </owc-layout-sidebar>`,
    );
    await el.updateComplete;

    expect(child.selected).to.equal(true);
    expect(parent.open).to.equal(true);
    const selected = el.shadowRoot.querySelector('a.selected');
    expect(selected.textContent).to.contain('Current');
  });

  it('renders the menuTopTemplate above the menu (regression)', async () => {
    const el = await fixture(
      html`<owc-layout-sidebar
        .menuItemList=${[{ label: 'Home', href: '/home' }]}
        .menuTopTemplate=${html`<div id="user-badge">Signed in</div>`}
      ></owc-layout-sidebar>`,
    );
    // the property existed (and is in the public types) but was never rendered
    expect(el.shadowRoot.querySelector('#top #user-badge')).to.exist;
  });
});

import { expect, fixture, html, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { OwcActionCard } from '@open-wc/components/action-card/OwcActionCard.js';
import '@open-wc/components/action-card/define/owc-action-card.js';

describe('owc-action-card public consumer', () => {
  it('01: places a leading icon beside a heading/body stack and a full-width action below', async () => {
    const card = await fixture(html`
      <owc-action-card style="width:358px">
        <span slot="icon" aria-hidden="true">+</span>
        <h3 slot="heading">Add an existing account</h3>
        <p>Keep your accounts together.</p>
        <button slot="actions">Add account</button>
      </owc-action-card>
    `);
    expect(card).to.be.instanceOf(OwcActionCard);
    const icon = card.shadowRoot.querySelector('.icon').getBoundingClientRect();
    const heading = card.querySelector('h3').getBoundingClientRect();
    const body = card.querySelector('p').getBoundingClientRect();
    const action = card.querySelector('button').getBoundingClientRect();
    const content = card.shadowRoot.querySelector('.content').getBoundingClientRect();
    expect(heading.left).to.be.greaterThan(icon.right);
    expect(body.top).to.be.at.least(heading.bottom);
    expect(action.top).to.be.greaterThan(body.bottom);
    expect(action.left).to.be.closeTo(content.left, 0.1);
    expect(action.width).to.be.closeTo(content.width, 0.1);
    expect(card.getAttribute('role')).to.equal(null);
    expect(card.hasAttribute('tabindex')).to.equal(false);
    await expect(card).to.be.accessible();
  });

  it('02: removes unused areas and reacts to actions and icons added or removed later', async () => {
    const card = await fixture(html`<owc-action-card><p>Information only.</p></owc-action-card>`);
    const actions = card.shadowRoot.querySelector('.actions');
    const icon = card.shadowRoot.querySelector('.icon');
    const heading = card.shadowRoot.querySelector('[part="heading"]');
    expect(getComputedStyle(actions).display).to.equal('none');
    expect(getComputedStyle(icon).display).to.equal('none');
    expect(getComputedStyle(heading).display).to.equal('none');
    const action = document.createElement('button');
    action.slot = 'actions';
    action.textContent = 'Continue';
    card.append(action);
    const visual = document.createElement('span');
    visual.slot = 'icon';
    visual.textContent = '+';
    card.append(visual);
    await waitUntil(() => !actions.hidden && !icon.hidden);
    action.remove();
    visual.remove();
    await waitUntil(() => actions.hidden && icon.hidden);
    const content = card.shadowRoot.querySelector('.content').getBoundingClientRect();
    expect(card.querySelector('p').getBoundingClientRect().left).to.be.closeTo(content.left, 0.1);
  });

  it('03: preserves native button activation and leaves the card itself outside the tab order', async () => {
    const host = await fixture(html`
      <div>
        <button id="before">Before</button>
        <owc-action-card>
          <h3 slot="heading">Add an account</h3>
          <p>Review your accounts in one place.</p>
          <button slot="actions">Add account</button>
        </owc-action-card>
        <button id="after">After</button>
      </div>
    `);
    const action = host.querySelector('[slot="actions"]');
    let activations = 0;
    action.addEventListener('click', () => activations++);
    host.querySelector('#before').focus();
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(action);
    await sendKeys({ press: 'Enter' });
    await sendKeys({ press: 'Space' });
    expect(activations).to.equal(2);
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(host.querySelector('#after'));
  });

  it('04: preserves links and allows consumers to use them without a whole-card overlay', async () => {
    const card = await fixture(html`
      <owc-action-card>
        <h2 slot="heading">Explore options</h2>
        <p>Choose a scenario.</p>
        <a slot="actions" href="#example-target">Open calculator</a>
      </owc-action-card>
    `);
    const link = card.querySelector('a');
    expect(link.getAttribute('href')).to.equal('#example-target');
    expect(card.shadowRoot.querySelector('a, button')).to.equal(null);
    link.focus();
    expect(document.activeElement).to.equal(link);
    await expect(card).to.be.accessible();
  });

  it('05: wraps long headings, content and actions at narrow widths', async () => {
    const card = await fixture(html`
      <owc-action-card style="width:240px">
        <h3 slot="heading">AnAccountReferenceWithoutAnySpaces123456789012345678901234567890</h3>
        <p>AnAccountDescriptionWithoutAnySpaces123456789012345678901234567890</p>
        <button slot="actions">AnActionWithoutAnySpaces123456789012345678901234567890</button>
      </owc-action-card>
    `);
    expect(card.scrollWidth).to.be.at.most(card.clientWidth);
    for (const element of card.querySelectorAll('h3, p, button')) {
      expect(element.scrollWidth).to.be.at.most(element.clientWidth);
    }
  });
});

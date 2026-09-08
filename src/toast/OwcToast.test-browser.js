import { expect, oneEvent, aTimeout } from '@open-wc/testing';
import { html } from 'lit';
import { toast, OwcToastComponent } from './OwcToast.js';

function containers() {
  return [...document.querySelectorAll('[class*="owc-toast-"]')];
}

describe('toast()', () => {
  afterEach(() => {
    containers().forEach(node => node.remove());
  });

  it('creates a fixed container and renders the toast into it', async () => {
    const el = toast({ text: 'hello world', duration: 60 });
    await el.updateComplete;

    const container = document.querySelector('.owc-toast-top-center');
    expect(container).to.exist;
    expect(container.contains(el)).to.equal(true);
    expect(container.style.position).to.equal('fixed');
    expect(container.style.top).to.equal('0px');
    expect(el.shadowRoot.textContent).to.include('hello world');
  });

  it('reuses the container for the same position', async () => {
    const first = toast({ text: 'one', duration: 60 });
    const second = toast({ text: 'two', duration: 60 });
    await first.updateComplete;

    expect(containers().length).to.equal(1);
    expect(containers()[0].children.length).to.equal(2);
    expect(second.parentElement).to.equal(containers()[0]);
  });

  it('creates separate containers per position, stacked accordingly', async () => {
    toast({ text: 'top', duration: 60 });
    const el = toast({ text: 'bottom', position: 'bottom-end', duration: 60 });
    await el.updateComplete;

    const bottom = document.querySelector('.owc-toast-bottom-end');
    expect(containers().length).to.equal(2);
    expect(bottom.style.bottom).to.equal('0px');
    expect(bottom.style.flexDirection).to.equal('column-reverse');
    expect(bottom.style.alignItems).to.equal('end');
  });

  it('renders the title and splits multi-line text with <br>', async () => {
    const el = toast({ title: 'Title', text: 'line1\nline2', duration: 60 });
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('strong').textContent).to.equal('Title');
    expect(el.shadowRoot.querySelectorAll('.callout-content br').length).to.be.greaterThan(1);
  });

  it('renders Lit content', async () => {
    const el = toast({ content: html`<strong data-content>Undo</strong>`, duration: 60 });
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('[data-content]').textContent).to.equal('Undo');
  });

  it('only renders string content as HTML when explicitly enabled', async () => {
    const safe = toast({ content: '<strong data-unsafe>Undo</strong>', duration: 60 });
    const unsafe = toast({
      content: '<strong data-unsafe>Undo</strong>',
      allowUnsafeHtml: true,
      duration: 60,
    });
    await safe.updateComplete;
    await unsafe.updateComplete;

    expect(safe.shadowRoot.querySelector('[data-unsafe]')).to.not.exist;
    expect(unsafe.shadowRoot.querySelector('[data-unsafe]').textContent).to.equal('Undo');
  });
});

describe('owc-toast-component', () => {
  afterEach(() => {
    containers().forEach(node => node.remove());
  });

  it('can be constructed without options', () => {
    const el = new OwcToastComponent();
    expect(el.variant).to.equal('brand');
    expect(el.duration).to.equal(4);
    expect(el.dismissible).to.equal(true);
    expect(el.progress).to.equal(100);
  });

  it('uses the default icon for the variant and reflects the variant', async () => {
    const el = toast({ text: 'x', variant: 'success', duration: 60 });
    await el.updateComplete;

    expect(el.getAttribute('variant')).to.equal('success');
    expect(el.shadowRoot.querySelector('wa-icon[slot="icon"]').name).to.equal('check-circle');
    expect(el.shadowRoot.querySelector('wa-callout').getAttribute('variant')).to.equal('success');
  });

  it('uses a custom icon when given', async () => {
    const el = toast({ text: 'x', icon: 'chat-left-text', duration: 60 });
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('wa-icon[slot="icon"]').name).to.equal('chat-left-text');
  });

  it('renders a dismiss button by default and hides it with dismissible false', async () => {
    const dismissible = toast({ text: 'x', duration: 60 });
    const notDismissible = toast({ text: 'x', dismissible: false, duration: 60 });
    await dismissible.updateComplete;
    await notDismissible.updateComplete;

    expect(dismissible.shadowRoot.querySelector('owc-icon-button')).to.exist;
    expect(notDismissible.shadowRoot.querySelector('owc-icon-button')).to.not.exist;
  });

  it('fires removed and detaches when the dismiss button is clicked', async () => {
    const el = toast({ text: 'x', duration: 60 });
    await el.updateComplete;

    setTimeout(() => el.shadowRoot.querySelector('owc-icon-button').click());
    await oneEvent(el, 'removed');
    expect(el.isConnected).to.equal(false);
  });

  it('remove() is idempotent and fires removed exactly once', async () => {
    const el = toast({ text: 'x', duration: 60 });
    await el.updateComplete;

    let removedCount = 0;
    el.addEventListener('removed', () => {
      removedCount += 1;
    });
    el.remove();
    el.remove();
    await aTimeout(600);
    expect(removedCount).to.equal(1);
    expect(el.isConnected).to.equal(false);
  });

  it('counts the progress down and auto-removes after the duration', async function autoRemove() {
    this.timeout(4000);
    const el = toast({ text: 'x', duration: 0.05 });
    await el.updateComplete;

    await oneEvent(el, 'removed');
    expect(el.isConnected).to.equal(false);
    expect(el.progress).to.be.lessThan(1);
  });

  it('pauses the progress countdown while hovered', async () => {
    const el = toast({ text: 'x', duration: 0.5 });
    await el.updateComplete;

    el.dispatchEvent(new Event('mouseenter'));
    const paused = el.progress;
    await aTimeout(100);
    expect(el.progress).to.equal(paused);

    el.dispatchEvent(new Event('mouseleave'));
    await aTimeout(100);
    expect(el.progress).to.be.lessThan(paused);
  });

  it('stops the progress timer when removed from the DOM', async () => {
    const el = toast({ text: 'x', duration: 0.5 });
    await el.updateComplete;

    el.parentElement.remove();
    await aTimeout(20);
    const progress = el.progress;
    await aTimeout(100);
    expect(el.progress).to.equal(progress);
  });
});

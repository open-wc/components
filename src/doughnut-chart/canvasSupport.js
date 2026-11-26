/** @type {Promise<unknown> | undefined} */
let loading;

/** Load shared support before Lit renders any canvas children. */
export async function ensureCanvasSupport() {
  if (
    'drawElementImage' in CanvasRenderingContext2D.prototype &&
    'requestPaint' in HTMLCanvasElement.prototype &&
    'content' in HTMLCanvasElement.prototype
  ) {
    return;
  }
  loading ??= import('@giuseppe-scotto-lavina/html-in-canvas-polyfill/loader').then(
    async ({ load }) => {
      const result = await load();
      if (result.status === 'refused' || result.status === 'error') {
        throw new Error('HTML-in-Canvas support unavailable');
      }
    },
  );
  await loading;
}

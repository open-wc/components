/**
 * Attributes for the anchor variant of the icon button. Empty strings are
 * treated as unset: a bare `download=""` attribute would otherwise turn every
 * same-origin link into a download instead of a navigation. Links opening in
 * another browsing context get `rel="noreferrer noopener"`.
 *
 * @param {{ href: string, target: string, download: string }} props
 * @returns {{ href: string, target: string | undefined, download: string | undefined, rel: string | undefined }}
 */
export function getLinkAttributes({ href, target, download }) {
  return {
    href,
    target: target || undefined,
    download: download || undefined,
    rel: target ? 'noreferrer noopener' : undefined,
  };
}

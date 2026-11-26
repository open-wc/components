/** @typedef {{category: import('./OwcDoughnutChart.types.js').OwcDoughnutChartCategory, start: number, end: number}} Slice */

/** @param {number} angle @param {number} radius @param {number} width @param {number} height */
function point(angle, radius, width, height) {
  return [width / 2 + radius * Math.sin(angle), height / 2 - radius * Math.cos(angle)];
}

/** @param {number} start @param {number} end @param {number} width @param {number} height */
export function slicePath(start, end, width, height) {
  const radius = height * 0.45;
  const inner = radius * 0.75;
  const mid = (start + end) / 2;
  const p = (/** @type {number} */ angle, /** @type {number} */ r) =>
    point(angle, r, width, height).join(' ');
  return [
    `M ${p(start, radius)}`,
    `A ${radius} ${radius} 0 0 1 ${p(mid, radius)}`,
    `A ${radius} ${radius} 0 0 1 ${p(end, radius)}`,
    `L ${p(end, inner)}`,
    `A ${inner} ${inner} 0 0 0 ${p(mid, inner)}`,
    `A ${inner} ${inner} 0 0 0 ${p(start, inner)} Z`,
  ].join(' ');
}

/**
 * Place exact amounts outside the ring, and require every icon corner to fit its true slice.
 * @param {Slice[]} slices
 * @param {number} width
 * @param {number} height
 * @param {Map<string, {width: number, height: number}>} sizes
 */
export function annotationsFor(slices, width, height, sizes) {
  const radius = height * 0.45;
  const annotations = slices.map(({ category, start, end }) => {
    const mid = (start + end) / 2;
    const [iconX, iconY] = point(mid, radius * 0.875, width, height);
    const showIcon = [-8, 8].every(dx =>
      [-8, 8].every(dy => {
        const x = iconX + dx - width / 2;
        const y = iconY + dy - height / 2;
        const distance = Math.hypot(x, y);
        const angle = (Math.atan2(x, -y) + 2 * Math.PI) % (2 * Math.PI);
        return (
          distance >= radius * 0.75 + 1 &&
          distance <= radius - 1 &&
          (end - start >= 2 * Math.PI - 1e-10 || (angle >= start && angle <= end))
        );
      }),
    );
    const labelSize = sizes.get(category.id) ?? { width: 0, height: 17 };
    const [sx, sy] = point(mid, radius, width, height);
    const [ex, ey] = point(mid, radius + 12, width, height);
    const right = Math.sin(mid) >= 0;
    const top = Math.max(4, Math.min(height - labelSize.height - 4, ey - labelSize.height - 4));
    // A radial endpoint can be outside the ring while its label box still overlaps the curve.
    // Move the box sideways just far enough to clear it, including near the top and bottom.
    const nearestY = Math.max(top, Math.min(height / 2, top + labelSize.height));
    const clearance = Math.sqrt(Math.max(0, (radius + 5) ** 2 - (nearestY - height / 2) ** 2));
    const left = right
      ? Math.max(ex + 8, width / 2 + clearance)
      : Math.min(ex - 8 - labelSize.width, width / 2 - clearance - labelSize.width);
    // Stop beside the amount instead of extending a line through vertically clamped text.
    const lineEnd = right ? left - 4 : left + labelSize.width + 4;
    const lineY = Math.max(top, Math.min(ey, top + labelSize.height));
    return {
      id: category.id,
      left,
      top,
      ...labelSize,
      iconX,
      iconY,
      showIcon,
      points: `${sx},${sy} ${ex},${ey} ${lineEnd},${lineY}`,
    };
  });
  const showLabels = annotations.every((a, i) => {
    const nearestX = Math.max(a.left, Math.min(width / 2, a.left + a.width));
    const nearestY = Math.max(a.top, Math.min(height / 2, a.top + a.height));
    return (
      a.width > 0 &&
      a.left >= 0 &&
      a.top >= 0 &&
      a.left + a.width <= width &&
      a.top + a.height <= height &&
      Math.hypot(nearestX - width / 2, nearestY - height / 2) > radius + 4 &&
      annotations
        .slice(i + 1)
        .every(
          b =>
            a.left + a.width + 4 <= b.left ||
            b.left + b.width + 4 <= a.left ||
            a.top + a.height + 4 <= b.top ||
            b.top + b.height + 4 <= a.top,
        )
    );
  });
  return { annotations, showLabels };
}

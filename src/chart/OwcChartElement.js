import { LitElement, html } from 'lit';

import ApexCharts from 'apexcharts';
import { roundPretty } from './roundPretty.js';

const de = {
  name: 'de',
  options: {
    months: [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ],
    shortMonths: [
      'Jan',
      'Feb',
      'Mär',
      'Apr',
      'Mai',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Okt',
      'Nov',
      'Dez',
    ],
    days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    toolbar: {
      exportToSVG: 'SVG speichern',
      exportToPNG: 'PNG speichern',
      exportToCSV: 'CSV speichern',
      menu: 'Menü',
      selection: 'Auswahl',
      selectionZoom: 'Auswahl vergrößern',
      zoomIn: 'Vergrößern',
      zoomOut: 'Verkleinern',
      pan: 'Verschieben',
      reset: 'Zoom zurücksetzen',
    },
  },
};

export const percentFormatter = new Intl.NumberFormat('de', {
  style: 'percent',
  maximumFractionDigits: 2,
});

export const numberFormatter = new Intl.NumberFormat('de', {
  maximumFractionDigits: 2,
});

export const colorArr = [
  '#1e40af',
  '#0c9467',
  '#8b39ab',
  '#c8329a',
  '#f34082',
  '#ff6267',
  '#ff8b4f',
  '#ffb63f',
  '#fde047',
];

export class OwcChartElement extends LitElement {
  static properties = {
    yData: { type: Array },
    options: { type: Object },
  };

  constructor() {
    super();
    /** @type { {name: string, color?: string, strokeWidth?: number, dashWidth?: number, data: ([string, number] | [number, number] | [Date, number])[], onClick?: (dataIndex: number) => void, zIndex?: number}[] } */
    this.yData = [];
    /**@type {{height?: string, yFormat?: 'percent' | ((y: number) => string), xLabel?: string, xStepSize?: number, yLabel?: string, title?: string, annotations?: object, type?: 'bar' | 'line', xType?: 'date' | 'number' | "customNumber", maxX?: number | Date, dashArray?: number[], strokeWidthArray?: number[], legendAlwaysVisible?: boolean, xLabelRotate?: number, valueFormat?: {prefix?: string, suffix?: string}, grid?: object} }}*/
    this.options = {};
    /** @type { {name: string, color?: String, data: ([string, number] | [number, number])[]}[] } */
    this.processedYData = [];
    this.apexOptions = {};

    this.numberFormatter = numberFormatter.format;
    this.percentFormatter = percentFormatter.format;
  }

  render() {
    return html`<div id="chart"></div> `;
  }

  firstUpdated() {
    let chartDiv = this.shadowRoot?.querySelector('div');
    this.chart = /** @type {import('apexcharts')} */ (new ApexCharts(chartDiv, this.apexOptions));
    this.chart.render();
  }

  disconnectedCallback() {
    this.chart?.destroy();
    this.chart = null;
    super.disconnectedCallback();
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('yData')) {
      let colorIndex = 0;
      this.processedYData = [];
      for (const line of this.yData) {
        if (this.options.xType === 'date') {
          this.processedYData.push({
            name: line.name,
            // @ts-ignore
            data: line.data.map(([date, value]) => [
              date instanceof Date ? date.valueOf() : new Date(date).valueOf(),
              value,
            ]),
            color: line.color || colorArr[colorIndex++],
          });
        } else if (this.options.xType === 'number') {
          // @ts-ignore
          this.processedYData.push({
            name: line.name,
            // @ts-ignore
            data: line.data.map(([number, value]) => ({ x: number, y: value })),
            color: line.color || colorArr[colorIndex++],
            zIndex: line.zIndex,
          });
        } else {
          // @ts-ignore
          this.processedYData.push({
            name: line.name,
            // @ts-ignore
            data: line.data.map(([date, value]) => ({ x: date.toString(), y: value })),
            color: line.color || colorArr[colorIndex++],
            zIndex: line.zIndex,
          });
        }
      }
    }

    if (changedProperties.has('yData') || changedProperties.has('options')) {
      this.apexOptions = {
        chart: {
          locales: [de],
          defaultLocale: 'de',
          events: {
            click: (
              /** @type {any} */ _event,
              /** @type {any} */ _chartContext,
              /** @type {{ seriesIndex: number; dataPointIndex: number }} */ opts,
            ) => {
              this.yData[opts.seriesIndex]?.onClick?.(opts.dataPointIndex);
            },
          },
          type: this.options?.type || 'line',
          stacked: false,
          height: this.options.height ?? 'auto',
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          dashArray: this.yData.map(elm => elm.dashWidth || 0),
          width: this.yData.map(elm => elm.strokeWidth || (this.options.type === 'bar' ? 0 : 5)),
        },
        series: this.processedYData || [],
        xaxis:
          this.options.xType === 'date'
            ? {
                type: 'datetime',
                labels: {
                  format: 'MMM',
                },
                title: {
                  text: this.options.xLabel,
                },
                // Set boundaries a little to the future
                max: this.options.maxX || new Date().setDate(new Date().getDate() + 20),
              }
            : this.options.xType === 'customNumber'
              ? {
                  type: 'category',
                  labels: {
                    rotate: this.options.xLabelRotate,
                    formatter: (/** @type {string | number} */ val) => {
                      if (!this.processedYData[0]?.data) {
                        return '0';
                      }
                      const nextIndex =
                        // @ts-ignore
                        this.processedYData[0].data.findIndex(elm => elm.x === val) + 1;
                      if (!nextIndex) {
                        return 'weird';
                      }
                      return `${this.options.valueFormat?.prefix || ''}${val}${
                        this.options.valueFormat?.suffix || ''
                      }`;
                    },
                  },
                  title: {
                    text: this.options.xLabel,
                  },
                }
              : this.options.xType === 'number'
                ? {
                    type: 'numeric',
                    stepSize: this.options.xStepSize,
                    title: {
                      text: this.options.xLabel,
                    },
                  }
                : {
                    type: 'category',
                    labels: {
                      formatter: (/** @type {string | number} */ val) => {
                        if (!this.processedYData[0]?.data) {
                          return '0';
                        }
                        const nextIndex =
                          // @ts-ignore
                          this.processedYData[0].data.findIndex(elm => elm.x === val) + 1;
                        if (!nextIndex) {
                          return 'weird';
                        }

                        return `${val}${
                          nextIndex >= this.processedYData[0].data.length
                            ? '+'
                            : // @ts-ignore
                              '-' + this.processedYData[0].data[nextIndex].x
                        }`;
                      },
                    },
                    title: {
                      text: this.options.xLabel,
                    },
                  },

        yaxis: {
          labels: {
            formatter: (/** @type {number} */ val) => {
              return typeof this.options.yFormat === 'function'
                ? this.options.yFormat(val)
                : this.options.yFormat === 'percent'
                  ? this.percentFormatter(val)
                  : this.numberFormatter(val);
            },
          },
          title: {
            text: this.options.yLabel,
          },
          min: 0,
          max: (/** @type {number} */ max) => {
            const newMax = Math.max(
              max,
              // @ts-ignore
              ...(this.options?.annotations?.yaxis?.map((/** @type {{ y: any; }} */ elm) =>
                isNaN(elm.y || NaN) ? Number.MIN_SAFE_INTEGER : elm.y,
              ) || []),
            );
            return roundPretty(newMax);
          },
        },
        title: {
          text: this.options.title,
        },
        legend: {
          showForSingleSeries: this.options.legendAlwaysVisible,
        },
        noData: {
          text: 'Loading...',
        },
        annotations: this.options.annotations || {},
        grid: this.options.grid || {},
      };
      if (this.chart) {
        this.chart.updateOptions(this.apexOptions);
      }
    }
    super.update(changedProperties);
  }
}

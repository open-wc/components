import { LitElement, html } from 'lit';
import 'apexcharts/dist/apexcharts.js';

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

const STANDARD_COLORS = [
  '#1e40af',
  '#10b981',
  '#8b39ab',
  '#c8329a',
  '#f34082',
  '#ff6267',
  '#ff8b4f',
  '#ffb63f',
  '#fde047',
  '#1e40af',
  '#10b981',
  '#8b39ab',
  '#c8329a',
  '#f34082',
  '#ff6267',
  '#ff8b4f',
  '#ffb63f',
  '#fde047',
  '#1e40af',
  '#10b981',
  '#8b39ab',
  '#c8329a',
  '#f34082',
  '#ff6267',
  '#ff8b4f',
  '#ffb63f',
  '#fde047',
];

export const percentFormatter = new Intl.NumberFormat('de', {
  style: 'percent',
  maximumFractionDigits: 2,
});

export const numberFormatter = new Intl.NumberFormat('de', {
  maximumFractionDigits: 2,
});

export class OwcPieChartElement extends LitElement {
  static properties = {
    yData: { type: Array },
    options: { type: Object },
  };

  constructor() {
    super();
    /** @type { {name: string, data: number, onClick?: () => void}[] } */
    this.yData = [];
    /**@type {{title?: string; otherIndex?: number}}*/
    this.options = {};
    /** @type { number[] } */
    this.series = [];
    /** @type {string[]} */
    this.labels = [];
    this.apexOptions = {};

    this.numberFormatter = numberFormatter.format;
    this.percentFormatter = percentFormatter.format;
  }

  render() {
    return html`<div id="chart"></div> `;
  }

  firstUpdated() {
    let chartDiv = this.shadowRoot?.querySelector('div');
    // eslint-disable-next-line no-undef
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
      this.labels = this.yData.map(elm => elm.name);
      this.series = this.yData.map(elm => elm.data);
    }

    if (changedProperties.has('yData') || changedProperties.has('options')) {
      const standardColorsCopy = [...STANDARD_COLORS];
      if (this.options.otherIndex) {
        standardColorsCopy.splice(this.options.otherIndex, 1, '#a1a1aa');
      }
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
              this.yData[opts.dataPointIndex]?.onClick?.();
            },
          },
          type: 'pie',
        },
        tooltip: {
          y: {
            formatter: (/** @type {number | bigint} */ val) => {
              return this.numberFormatter(val);
            },
          },
        },
        dataLabels: {
          enabled: false,
          /**
           * @param {number} val
           */
          formatter: val => {
            return this.percentFormatter(val / 100);
          },
        },
        colors: standardColorsCopy,
        series: this.series || [],
        labels: this.labels || [],
        title: {
          text: this.options.title,
        },
        noData: {
          text: 'Keine Daten',
        },
        legend: {
          position: 'bottom',
        },
      };
      if (this.chart) {
        this.chart.updateOptions(this.apexOptions);
      }
    }
    super.update(changedProperties);
  }
}

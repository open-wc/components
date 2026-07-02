import { LitElement, html, css } from 'lit';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';

export class OwcLoadingScreen extends LitElement {
  static properties = {
    autofill: { type: Boolean },
    progress: { type: Number },
    logoSvg: { type: Object },
  };

  constructor() {
    super();
    this.progress = 0;
    this.logoSvg = '';
    this.autofill = false;
  }

  render() {
    if (this.autofill) {
      setTimeout(() => {
        this.progress += 0.01;
      }, 150);
    }
    return html` <div class="centered">
      ${this.logoSvg ? html`<div id="logo">${this.logoSvg}</div>` : ''}
      <div id="percentage-container">
        <div id="percentage">
          ${
            // Always stop at 99%
            Math.min(Math.floor(this.progress * 100), 99)
          }%
        </div>
        <wa-spinner style="--track-width: 1px;"></wa-spinner>
      </div>
    </div>`;
  }

  static styles = [
    css`
      wa-spinner {
        font-size: 100px;
        margin-left: auto;
        margin-right: auto;
      }

      #logo {
        width: 400px;
        margin-bottom: 18px;
        display: block;
        margin-left: auto;
        margin-right: auto;
      }

      #percentage-container {
        position: relative;
        text-align: center;
      }

      #percentage {
        position: absolute;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .centered {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    `,
  ];
}

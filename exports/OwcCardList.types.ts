export { Fields, OwcCardListOptions } from '../src/card-list/CardListTypes.js';

import { OwcCardList } from './OwcCardList.js';

declare global {
  interface HTMLElementTagNameMap {
    'owc-card-list': OwcCardList<Record<string, unknown>>;
  }
}

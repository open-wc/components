/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

import { SmallEventTarget } from './SmallEventTarget.js';

/**
 * @implements {ReactiveController}
 */
export class WaveController {
  static finalize() {
    this._finalized = true;
  }

  static _finalized = false;

  recieveEvents = true;
  /**
   *
   * @param {import('lit').ReactiveElement | import('./ReactiveObject.js').ReactiveObject} host
   * @param {Record<string, import('./WaveControllerTypes.js').ListenerMode>} [reactiveProperties] listenToSelfUpdate defaults to true
   * @param {{mode?: import('./WaveControllerTypes.js').ControllerMode}} [options]
   */
  constructor(host, reactiveProperties, options) {
    const reactivePropertiesActual = reactiveProperties || {};
    // Validate input
    for (const [key, mode] of Object.entries(reactivePropertiesActual)) {
      if (!mode || !mode.match(/^(self|parent|child)(\+(self|parent|child))*Update$/)) {
        throw new Error(`Invalid property mode: ${key}: ${mode}`);
      }
    }

    // Set properties
    this.host = host;
    this.applyOptions(options);
    this.propertyValueMap =
      /**@type {Record<string, {value?: EventTarget | SmallEventTarget, listeners?: EventListenerOrEventListenerObject[]} | {value?: EventTarget | SmallEventTarget, listeners?: EventListenerOrEventListenerObject[]}[] >}*/ ({});
    for (const [propertyName] of Object.entries(reactivePropertiesActual)) {
      this.propertyValueMap[propertyName] = { value: undefined, listeners: undefined };
    }
    this.propertyMap = reactivePropertiesActual;
    host.addController(this);
  }

  /**
   *
   * @param {{mode?: import('./WaveControllerTypes.js').ControllerMode}} [options]
   */
  applyOptions(options) {
    if (!options?.mode) {
      this.waveTriggersUpdate = false;
      this.forwardWave = true;
      this.updateSendsWave = true;
    } else {
      const splittedMode = options.mode.split('+');
      this.waveTriggersUpdate = false;
      this.forwardWave = false;
      this.updateSendsWave = false;
      for (const mode of splittedMode) {
        if (!['waveTriggersUpdate', 'forwardWave', 'updateSendsWave'].includes(mode)) {
          throw new Error(`Invalid mode: ${options.mode}`);
        }
        const typedMode = /**@type {'waveTriggersUpdate' | 'forwardWave' | 'updateSendsWave'}*/ (
          mode
        );
        this[typedMode] = true;
      }
    }
  }

  hostUpdate() {
    // Handle parent and child listener updates
    const typedHost = /**@type {Record<string, any>} */ (this.host);
    for (const [propertyName, propertyData] of Object.entries(this.propertyValueMap)) {
      const newValue = typedHost?.[propertyName];
      // if newValue is undefined or was never set, abort all listeners
      if (!newValue) {
        if (Array.isArray(propertyData)) {
          propertyData.forEach(elm => {
            elm.listeners?.forEach(listener => {
              this.#removeEventListeners(elm.value, listener);
            });
          });
        } else {
          propertyData.listeners?.forEach(listener =>
            this.#removeEventListeners(propertyData.value, listener),
          );
        }
      }

      const propertyPreferences = this.propertyMap[propertyName];
      let newProperty;
      // Choose appropriate handler and input for the situation
      if (Array.isArray(newValue)) {
        if (Array.isArray(propertyData)) {
          // Both new and old are arrays
          newProperty = this.#handleArrayPropertyUpdate(
            propertyData,
            { name: propertyName, oldValue: propertyData.map(elm => elm.value) },
            newValue,
            propertyPreferences,
          );
        } else {
          // Old is not array, but new is => make an array out of old
          newProperty = this.#handleArrayPropertyUpdate(
            [propertyData],
            { name: propertyName, oldValue: [propertyData.value] },
            newValue,
            propertyPreferences,
          );
        }
      } else {
        if (Array.isArray(propertyData)) {
          // Old is array but new isnt => abort all controllers and call handler with empty input
          propertyData.forEach(elm =>
            elm.listeners?.forEach(listener => this.#removeEventListeners(elm.value, listener)),
          );
          newProperty = this.#handleSinglePropertyUpdate(
            {},
            { name: propertyName, oldValue: propertyData.map(elm => elm.value) },
            newValue,
            propertyPreferences,
          );
        } else {
          // Neither new nor old are arrays
          newProperty = this.#handleSinglePropertyUpdate(
            propertyData,
            { name: propertyName, oldValue: propertyData.value },
            newValue,
            propertyPreferences,
          );
        }
      }
      this.propertyValueMap[propertyName] = newProperty;
    }

    // Dispatch update event on this, as something has changed
    if (this.updateSendsWave && WaveController._finalized) {
      this.dispatchRequestUpdateEvent('selfUpdate');
    }
  }

  hostDisconnected() {
    for (const [, property] of Object.entries(this.propertyValueMap)) {
      if (Array.isArray(property)) {
        property.forEach(elm =>
          elm.listeners?.forEach(listener => this.#removeEventListeners(elm.value, listener)),
        );
      } else {
        property.listeners?.forEach(listener =>
          this.#removeEventListeners(property.value, listener),
        );
      }
    }
  }

  /**
   *
   * @param {'selfUpdate' | 'childUpdate' | 'parentUpdate'} dispatchedName
   */
  dispatchRequestUpdateEvent(dispatchedName) {
    this.recieveEvents = false;
    this.host.dispatchEvent(new Event(dispatchedName));
    this.recieveEvents = true;
  }

  /**
   * @param {EventTarget | SmallEventTarget} source
   * @param {'selfUpdate' | 'childUpdate' | 'parentUpdate'} dispatchedName
   * @param {('selfUpdate' | 'childUpdate' | 'parentUpdate')[]} listendedNames
   */
  addReDispatchListener(source, dispatchedName, listendedNames) {
    const eventFunction = () => {
      if (this.recieveEvents && WaveController._finalized) {
        this.dispatchRequestUpdateEvent(dispatchedName);
      }
    };
    for (const name of listendedNames) {
      source.addEventListener(name, eventFunction);
    }
    return eventFunction;
  }

  /**
   * @param {EventTarget | SmallEventTarget} source
   * @param {{name: string, oldValue: any}} property
   * @param {('selfUpdate' | 'childUpdate' | 'parentUpdate')[]} listendedNames
   */
  addRequestUpdateListener(source, property, listendedNames) {
    const eventFunction = () => {
      if (this.recieveEvents) {
        // TODO: I dont get why we need ts-ignore here, probably because ReactiveObject has no types
        // @ts-ignore
        this.host.requestUpdate(property.name, property.oldValue);
      }
    };
    for (const name of listendedNames) {
      source.addEventListener(name, eventFunction);
    }
    return eventFunction;
  }

  /**
   * @param {EventTarget | SmallEventTarget | undefined} source
   * @param {EventListenerOrEventListenerObject} listener
   */
  #removeEventListeners(source, listener) {
    if (!source) {
      return;
    }
    for (const name of ['selfUpdate', 'childUpdate', 'parentUpdate']) {
      source.removeEventListener(name, listener);
    }
  }

  /**
   *
   * @param {EventTarget | SmallEventTarget} source
   * @param {{name: string, oldValue: any}} property
   * @param {'selfUpdate' | 'childUpdate' | 'parentUpdate'} dispatchedName
   * @param {('selfUpdate' | 'childUpdate' | 'parentUpdate')[]} listendedNames
   */
  #addListeners(source, property, dispatchedName, listendedNames) {
    const listeners = [];
    if (this.waveTriggersUpdate) {
      listeners.push(this.addRequestUpdateListener(source, property, listendedNames));
    }
    if (this.forwardWave) {
      listeners.push(this.addReDispatchListener(source, dispatchedName, listendedNames));
    }
    return listeners;
  }

  /**
   *
   * @param {{value?: EventTarget | SmallEventTarget, listeners?: EventListenerOrEventListenerObject[]}[]} propertyData
   * @param {{name: string, oldValue: any}} property
   * @param {any[]} newValue
   * @param {import('./WaveControllerTypes.js').ListenerMode} propertyPreferences
   */
  #handleArrayPropertyUpdate(propertyData, property, newValue, propertyPreferences) {
    // remove listeners of deleted elements
    for (const { value, listeners } of propertyData) {
      if (!newValue.includes(value) && value) {
        listeners?.forEach(listener => this.#removeEventListeners(value, listener));
      }
    }

    // Add listeners to new elements
    const newProperty = [];
    for (const element of newValue) {
      const oldElement = propertyData.find(elm => elm.value === element);
      if (!oldElement && (element instanceof EventTarget || element instanceof SmallEventTarget)) {
        newProperty.push({
          value: element,
          listeners: this.#addListeners(
            element,
            property,
            'childUpdate',
            preferencesToArray(propertyPreferences),
          ),
        });
      } else if (oldElement) {
        newProperty.push(oldElement);
      }
    }
    return newProperty;
  }

  /**
   *
   * @param {{value?: EventTarget | SmallEventTarget, listeners?: EventListenerOrEventListenerObject[]}} propertyData
   * @param {{name: string, oldValue: any}} property
   * @param {any} newValue
   * @param {import('./WaveControllerTypes.js').ListenerMode} propertyPreferences
   */
  #handleSinglePropertyUpdate(propertyData, property, newValue, propertyPreferences) {
    if (newValue === propertyData.value) {
      return propertyData;
    }

    const oldValue = propertyData.value;
    const oldListeners = propertyData.listeners;
    if (oldListeners && oldValue) {
      oldListeners.forEach(listener => this.#removeEventListeners(oldValue, listener));
    }

    return {
      value: newValue,
      listeners:
        newValue instanceof EventTarget || newValue instanceof SmallEventTarget
          ? this.#addListeners(
              newValue,
              property,
              'parentUpdate',
              preferencesToArray(propertyPreferences),
            )
          : [],
    };
  }
}

/**
 *
 * @param {import('./WaveControllerTypes.js').ListenerMode} preferences
 * @returns {('selfUpdate' | 'childUpdate' | 'parentUpdate')[]}
 */
function preferencesToArray(preferences) {
  /**@type {('selfUpdate' | 'childUpdate' | 'parentUpdate')[]} */
  const returnArr = [];
  if (preferences.includes('child')) {
    returnArr.push('childUpdate');
  }
  if (preferences.includes('parent')) {
    returnArr.push('parentUpdate');
  }
  if (preferences.includes('self')) {
    returnArr.push('selfUpdate');
  }
  return returnArr;
}

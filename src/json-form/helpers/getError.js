import { dataPathSegments } from '../resolve.js';

/**
 * Finds the validation error that belongs to the control at the given scope.
 *
 * "required" errors are reported on the parent object, so they are matched by
 * property name. Required errors originating from an if/then/else branch carry
 * the branch in their instanceLocation, which has to be stripped before matching.
 * All other errors are matched by their exact instance location.
 * @param {import("../types/schema.js").ControlElement} uiSchema
 * @param {import("@cfworker/json-schema").ValidationResult} validatorState
 * @returns {import("@cfworker/json-schema").OutputUnit | undefined}
 */
export function getError(uiSchema, validatorState) {
  const path = '#/' + dataPathSegments(uiSchema.scope).join('/');
  for (const error of validatorState.errors) {
    if (error.keyword === 'required') {
      const errorPropertyName = error.error.match(/"(.*)"/)?.[1];
      const splittedLocation = error.instanceLocation.split('/');
      const instanceLocationWithoutIf =
        splittedLocation.at(-2) === 'then' || splittedLocation.at(-2) === 'else'
          ? splittedLocation.slice(0, -2).join('/')
          : error.instanceLocation;
      if (
        errorPropertyName &&
        path.startsWith(`${instanceLocationWithoutIf}/${errorPropertyName}`)
      ) {
        return error;
      }
    } else if (error.instanceLocation === path) {
      return error;
    }
  }
}

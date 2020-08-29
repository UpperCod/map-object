/**
 * Determines if a value is of type "object"
 * @param {any} value
 */
export const isObject = (value) => value && typeof value == "object";
/**
 * Determines if a value is of type Array
 * @param {any} value
 */
export const isArray = (value) => Array.isArray(value);
/**
 * Create an object based on the type
 * @param {any} value
 */
export const createIterable = (value) => (isArray(value) ? [] : {});

/**
 * Mutate an object
 * @param {object|object[]} master
 * @param {object|object[]} commit
 * @param {string} [exclude]
 */
export function merge(master, commit, exclude) {
    for (const prop in commit) {
        if (prop != exclude) master[prop] = commit[prop];
    }
}

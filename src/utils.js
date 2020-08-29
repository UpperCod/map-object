/**
 *
 * @param {any} value
 */
export const isObject = (value) => value && typeof value == "object";
/**
 *
 * @param {any} value
 */
export const isArray = (value) => Array.isArray(value);
/**
 *
 * @param {any} value
 */
export const createIterable = (value) => (isArray(value) ? [] : {});

/**
 *
 * @param {object|object[]} master
 * @param {object|object[]} commit
 * @param {string} [exclude]
 */
export function merge(master, commit, exclude) {
    for (const prop in commit) {
        if (prop != exclude) master[prop] = commit[prop];
    }
}

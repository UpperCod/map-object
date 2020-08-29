import createTree from "@uppercod/imported";
import { isObject, isArray, createIterable, merge } from "./utils";
/**
 * Preconfigure the execution of mapObject and cache the function reading from the file
 * @param {data} data
 * @param {plugins} maps
 * @param {parallel} [parallel]
 */
export default function load(data, maps, parallel = {}) {
    if (!data.tree) {
        const tree = createTree();
        tree.add(data.file);
        data.tree = tree;
    }
    return (parallel[data.file] =
        parallel[data.file] || mapObject(data, maps, parallel));
}
/**
 * This function iterates over an object generated a copy of it,
 * this iteration allows the execution of pllugins according to
 * the index of the iteration.
 * @param {data} data
 * @param {plugins} maps
 * @param {parallel} [parallel]
 */
async function mapObject({ file, value, tree, root }, maps, parallel) {
    let masterValue = createIterable(value);
    root = root || masterValue;
    for (let prop in value) {
        if (maps[prop]) {
            /**@type {any} */
            const commitValue = await maps[prop](
                {
                    file,
                    value: value[prop],
                    root,
                    tree,
                },
                {
                    addChild: (child) =>
                        child != file && tree.addChild(file, child),
                    load: async (data) => {
                        if (data.file && data.file != file)
                            tree.addChild(file, data.file);
                        const { value } = await load(
                            { file, ...data, root, tree },
                            maps,
                            parallel
                        );
                        return value;
                    },
                }
            );
            if (isArray(commitValue)) {
                if (masterValue == root) {
                    root = masterValue = commitValue;
                } else {
                    masterValue = commitValue;
                }
                break;
            }
            if (isObject(commitValue)) {
                merge(masterValue, value, prop);
                merge(masterValue, commitValue);
            } else if (masterValue != root) {
                masterValue = commitValue;
                break;
            }
        } else if (isObject(value[prop])) {
            masterValue[prop] = (
                await mapObject(
                    { file, value: value[prop], tree, root },
                    maps,
                    parallel
                )
            ).value;
        } else {
            masterValue[prop] = value[prop];
        }
    }
    return { file, root, value: masterValue, tree };
}

/**
 * It is an object that allows to share the reading between load,
 * caching the process associated with a file
 * @typedef {{[file:string]:Promise<data>}} parallel
 */

/**
 * It is a context associated only to the reading instance of the
 * property and the file, it allows executing manipulations while
 * keeping the file's reading data
 * @typedef {Object} Context
 * @property {(data:data)=>Promise<any>} load
 * @property {(file:string)=>void} addChild
 */

/**
 * The plugin allows access to the value of an object if it defines
 * the property with which the plugin is associated
 * @callback plugin
 * @param {data} data
 * @param {Context} utils
 */

/**
 * @typedef {{[plugin:string]:plugin}} plugins
 */

/**
 * This object is the interface that all plugin or load executions share
 * @typedef {Object} data
 * @property {string} file - filename
 * @property {any} value - value associated with load or plugin index
 * @property {object|object[]} [root] - Root object reference
 * @property {import("@uppercod/imported").Context} [tree] - Import reference map
 */

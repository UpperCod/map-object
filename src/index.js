import createTree from "@uppercod/imported";
import { isObject, isArray, createIterable, merge } from "./utils";
/**
 *
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
 *
 * @param {data} data
 * @param {plugins} maps
 * @param {parallel} [parallel]
 */
async function mapObject({ file, value, tree, root }, maps, parallel) {
    let masterValue = createIterable(value);
    root = root || masterValue;
    for (let prop in value) {
        if (maps[prop]) {
            /**@type {Object|Object[]} */
            const commitValue = await maps[prop](
                {
                    file,
                    value: value[prop],
                    root,
                },
                {
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
 * @typedef {{[file:string]:Promise<data>}} parallel
 */

/**
 * @callback plugin
 * @param {data} data
 * @param {{load:(data:data)=>Promise<any>}} next
 */

/**
 * @typedef {{[plugin:string]:plugin}} plugins
 */

/**
 * @typedef {Object} data
 * @property {string} file
 * @property {object|object[]} value
 * @property {object|object[]} [root]
 * @property {import("@uppercod/imported").Context} [tree]
 */

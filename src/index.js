import yaml from "js-yaml";
import createCache from "@uppercod/cache";

const cache = createCache();

const isObject = (value) => value && typeof value == "object";

const isYaml = (file) => /\.(yaml|yml)$/.test(file);

const isJson = (file) => /\.json$/.test(file);

const parse = (code) => yaml.safeLoad(code);

/**
 *
 * @param {string} config.file - Name of the file to use as the basis for the relative search
 * @param {string} config.code - File code config.file
 * @param {(src)=>Promise<string>} config.mapProps - External function for file resolution
 * @param {object} parallel - object that stores recurring queries resolved in parallel, this avoids generating double read queries
 */
export default function loader({ file, code }, props) {
    const propMaps = ["ref", ...Object.keys(props)];
    const regPropMaps = RegExp(`^\\$(${propMaps.join("|")})$`);
    const regMapCode = RegExp(`\\$(${propMaps.join("|")})`);

    const parallel = {};

    return load(
        {
            file,
            code,
            regPropMaps,
            regMapCode,
            mapProps: async (type, value, root, file) => ({
                file,
                ...(await props[type.slice(1)](value, root, file)),
            }),
        },
        parallel
    );
}
/**
 * @param {string} config.file - Name of the file to use as the basis for the relative search
 * @param {string} config.code - File code config.file
 * @param {(src)=>Promise<string>} config.mapProps - External function for file resolution
 */
function load({ file, code, mapProps, regPropMaps, regMapCode }, parallel) {
    const raw = isObject(code);
    const data = raw
        ? code
        : isJson(file)
        ? JSON.parse(code)
        : isYaml(file)
        ? cache(parse, code)
        : code;
    if (raw || regMapCode.test(code)) {
        return (parallel[file] =
            parallel[file] ||
            mapRef(data, regPropMaps, async (type, value, root) => {
                let child = await mapProps(type, value, root, file);
                if (child.file != file) {
                    value = await load(
                        {
                            code: child.value,
                            file: child.file,
                            mapProps,
                            regPropMaps,
                            regMapCode,
                        },
                        parallel
                    );
                    return child.after ? child.after(value) : value;
                }
                return child.value;
            }));
    } else {
        return data;
    }
}

/**
 *
 * @param {object|any[]} data - data to extract for reading from $ref
 * @param {(data:any,data:object|any[])=>Promise<any>} map - function to reduce the extraction of the $ref
 * @param {object|any[]} [root] - context to use as root to scan the $ref
 */
async function mapRef(data, regPropMaps, map, root) {
    // clone to remove reference from cache
    const isArrayData = Array.isArray(data);
    const copy = isArrayData ? [] : {};
    for (let prop in data) {
        if (regPropMaps.test(prop)) {
            const value = await map(prop, data[prop], root);
            if (isObject(value)) {
                const nextValue = isArrayData
                    ? data
                    : { ...value, ...data, ...copy };
                delete nextValue[prop];
                const nextRoot = root == data ? nextValue : root || nextValue;
                if (Array.isArray(value)) {
                    return Promise.all(
                        value.map((value) =>
                            isObject(value)
                                ? mapRef(value, regPropMaps, map, nextRoot)
                                : value
                        )
                    );
                }
                if (isObject(nextValue)) {
                    return await mapRef(nextValue, regPropMaps, map, nextRoot);
                }
            }
            return value;
        } else {
            if (isObject(data[prop])) {
                copy[prop] = await mapRef(
                    data[prop],
                    regPropMaps,
                    map,
                    root || copy
                );
            } else {
                copy[prop] = data[prop];
            }
        }
    }
    return copy;
}

import path from "path";
import yaml from "js-yaml";
import getProp from "@uppercod/get-prop";
import createCache from "@uppercod/cache";

const cache = createCache();

const isObject = (value) => value && typeof value == "object";

/**
 * Determine if the file starts as url
 * @param {string} file
 */
const isUrl = (file) => /^(http(s){0,1}:){0,1}\/\//.test(file);

const isYaml = (file) => /\.(yaml|yml)$/.test(file);

const isJson = (file) => /\.json$/.test(file);

const parse = (code) => yaml.safeLoad(code);

const propMaps = ["ref", "fn"];
const regPropMaps = RegExp(`^\\$(${propMaps.join("|")})$`);
const regMapCode = RegExp(`\\$(${propMaps.join("|")})`);
/**
 *
 * @param {string} config.file - Name of the file to use as the basis for the relative search
 * @param {string} config.code - File code config.file
 * @param {(src)=>Promise<string>} config.readFile - External function for file resolution
 * @param {object} parallel - object that stores recurring queries resolved in parallel, this avoids generating double read queries
 */
export default function loader({ file, code, readFile }, parallel = {}) {
    return load({
        file,
        code,
        readFile: (src) => (parallel[src] = parallel[src] || readFile(src)),
    });
}
/**
 * @param {string} config.file - Name of the file to use as the basis for the relative search
 * @param {string} config.code - File code config.file
 * @param {(src)=>Promise<string>} config.readFile - External function for file resolution
 */
function load({ file, code, readFile }) {
    const { dir } = path.parse(file);
    const raw = isObject(code);
    const data = raw
        ? code
        : isJson(file)
        ? JSON.parse(code)
        : isYaml(file)
        ? cache(parse, code)
        : code;
    if (!isUrl(file) && (raw || regMapCode.test(code))) {
        return mapRef(data, async (type, value, root) => {
            if (type == "$ref") {
                let [, src, prop] = value.match(
                    /([^~#]*)(?:(?:~|#\/){0,1}(.+)){0,1}/
                );
                if (src) {
                    src = isUrl(src) ? src : path.join(dir, src);
                    try {
                        root = await readFile(src).then((code) =>
                            load({ file: src, code, readFile })
                        );
                    } catch (e) {
                        throw `File ${src} imported by ${file} does not exist`;
                    }
                }
                return prop ? getProp(root, prop) : src ? root : null;
            }
            if (type == "$fn") {
                let [src, args] = [].concat(value);
                src = path.join(dir, src);
                let fn;
                try {
                    fn = require(src);
                } catch (e) {
                    throw `File ${src} imported by ${file} does not exist`;
                }
                return await fn(args);
            }
        });
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
async function mapRef(data, map, root) {
    // clone to remove reference from cache
    const isArrayData = Array.isArray(data);
    data = isArrayData ? [...data] : { ...data };
    for (let prop in data) {
        if (regPropMaps.test(prop)) {
            const value = await map(prop, data[prop], root);
            if (isObject(value)) {
                delete data[prop];
                const nextValue = isArrayData ? data : { ...value, ...data };
                const nextRoot = root == data ? nextValue : root || nextValue;
                if (Array.isArray(value)) {
                    return Promise.all(
                        value.map((value) =>
                            isObject(value)
                                ? mapRef(value, map, nextRoot)
                                : value
                        )
                    );
                }
                if (isObject(nextValue)) {
                    return await mapRef(nextValue, map, nextRoot);
                }
            }
            return value;
        } else {
            if (isObject(data[prop])) {
                data[prop] = await mapRef(data[prop], map, root || data[prop]);
            }
        }
    }
    return data;
}

import path from "path";
import yaml from "js-yaml";
import getProp from "@uppercod/get-prop";
import createCache from "@uppercod/cache";
import { throws } from "assert";

const cache = createCache();

const isObject = (value) => value && typeof value == "object";

const parse = (code) => yaml.safeLoad(code);

const propMaps = ["ref", "fn"];
const regPropMaps = RegExp(`^\\$(${propMaps.join("|")})$`);
const regMapCode = RegExp(`\\$(${propMaps.join("|")})`);
/**
 *
 * @param {*} config.file - Name of the file to use as the basis for the relative search
 * @param {*} config.code - File code config.file
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
 * @param {*} config.file - Name of the file to use as the basis for the relative search
 * @param {*} config.code - File code config.file
 * @param {(src)=>Promise<string>} config.readFile - External function for file resolution
 */
function load({ file, code, readFile }) {
    const { dir } = path.parse(file);
    const raw = isObject(code);
    const data = raw ? code : cache(parse, code);
    if (raw || regMapCode.test(code)) {
        return mapRef(data, async (type, value, root) => {
            if (type == "$ref") {
                let [, src, prop] = value.match(
                    /([^~#]*)(?:(?:~|#\/){0,1}(.+)){0,1}/
                );
                if (src) {
                    src = path.join(dir, src);
                    try {
                        root = await readFile(src).then((code) =>
                            load({ file, code, readFile })
                        );
                    } catch (e) {
                        throws`${file}  The file ${src} required by the document cannot be found`;
                    }
                }
                return prop ? getProp(root, prop) : src ? root : null;
            }
            if (type == "$fn") {
                const [src, args] = [].concat(value);
                src = path.join(dir, src);
                let fn;
                try {
                    fn = require(file);
                } catch (e) {
                    throws`${file}: The file ${src} required by the document cannot be found`;
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
    for (let prop in data) {
        if (regPropMaps.test(prop)) {
            let value = await map(prop, data[prop], root);
            if (isObject(value)) {
                let nextData = { ...data };
                delete nextData[prop];
                let nextValue = { ...value, ...nextData };
                let nextRoot = root == data ? nextValue : root || nextValue;
                if (Array.isArray(value)) {
                    return Promise.all(
                        value.map((value) =>
                            isObject(value)
                                ? mapRef(value, map, nextRoot)
                                : value
                        )
                    );
                } else {
                    return await mapRef(nextValue, map, nextRoot);
                }
            } else {
                return value;
            }
        } else {
            if (isObject(data[prop])) {
                data[prop] = await mapRef(data[prop], map, root || data[prop]);
            }
        }
    }
    return data;
}

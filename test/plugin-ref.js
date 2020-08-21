import path from "path";
import { readFile } from "fs/promises";
import getProp from "@uppercod/get-prop";

export async function ref(value, root, file) {
    const { dir } = path.parse(file);
    const [, src, prop] = value.match(/([^~#]*)(?:(?:~|#\/){0,1}(.+)){0,1}/);
    if (src) {
        try {
            file = path.join(dir, src);
            value = await readFile(file, "utf-8");
        } catch (e) {
            return { file, value };
        }
    }
    return {
        file,
        value: src ? value : getProp(root, prop),
        after: prop ? (data) => getProp(data, prop) : false,
    };
}

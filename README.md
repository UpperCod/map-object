# yaml

This script adds a layer to [js-yaml](https://www.npmjs.com/package/js-yaml) to add support for special properties with the wildcard `$` like `$ref`, example:

```js
import path from "path";
import { readFile } from "fs/promises";
import loader from "./src";
import getProp from "@uppercod/get-prop";

const test = async (file) =>
    loader(
        {
            file,
            code: await readFile(file, "utf-8"),
        },
        {
            async ref(value, root, file) {
                const { dir } = path.parse(file);
                const [, src, prop] = value.match(
                    /([^~#]*)(?:(?:~|#\/){0,1}(.+)){0,1}/
                );
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
            },
        }
    );

test(path.join(__dirname, "./test/files/e.yaml")).then(console.log);
```

The return `{file, value}` is strict since it allows identifying the origin of the data between reads.

## Install

```
npm install @uppercod/yaml
```

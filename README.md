# map-object

Api for creating plugins capable of modifying an object according to its index, this library is created to implement the use of `$ref`.

### \$ref implementation example

```js
import path from "path";
import { readFile } from "fs/promises";
import loadData from "../../src/index";

loadData(
    {
        file: path.join(__dirname, "data.json"),
        value: {
            $ref: "files/users.json",
        },
    },
    {
        async $ref({ value, file }, { load, addChild }) {
            const { dir } = path.parse(file);
            const src = path.join(dir, file);
            return load({
                file: src,
                value: JSON.parse(await readFile(src, "utf-8")),
            });
        },
    }
);
```

**The execution of load inside `$ref` allows associating an additional import on the tree object returned by loadData**, the tree object is managed by the pkg [@uppercod/imported](https://github.com/UpperCod/imported).

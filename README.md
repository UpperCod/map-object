# yaml

Add a layer to [js-yaml](https://www.npmjs.com/package/js-yaml) to allow special behaviors based on the structuring of JSON or YAML type documents, adding to these:

1. Supports `$ref`, to reference other documents.
2. Support for `$fn`, to fill data based on the execution of functions.

## Install

```
npm install @uppercod/yaml
```

## Usage

```js
import { readFile } from "fs/promises";
import { join } from "path";
import parse from "@uppercod/yaml";

async function getData() {
    let file = join(__dirname, "/test/files/a.yaml");
    let code = await readFile(file, "utf-8");
    return await parse({
        file,
        code,
        readFile: (src) => readFile(src, "utf-8"),
    });
}

getData().then(console.log);
```

## Api

```ts
function parse({
    file: string,
    code: string,
    readFile: (src: string) => string,
},parallel?:Object):Promise<Object|any[]>;
```

Donde:

1.  `file`: String, path of the file referring to the yaml file.
2.  `code`: String, code of the yaml file.
3.  `readFile`: Function, function to use for reading the document.
4.  `parallel`: Optional object, allows to reference parallel reads between executions, **This allows multiple concurrent instances to allow referencing the same document without generating another reading**

## Examples

### Example 1, \$ref between documents.

**a.yaml**

```yaml
$ref: ./b.yaml
```

**b.yaml**

```yaml
title: i am b!
```

**output**

```json
{
    "title": "i am b!"
}
```

### Example 2, \$ref as selector

```yaml
cover: ./image.jpg
files:
    thumbnail:
        $ref: ~cover
```

`$ref` allows to reference data from the built context from the root,`$ref` also supports the following reference expressions:

1. `b.yaml~cover`, from the library.
2. `b.yaml#/cover`, homologous to the \$ref pattern of [json-schema](https://json-schema.org/
   understanding-json-schema/structuring.html).

### example 3, \$fn

```yaml
$fn:
    - data.js
    - id: 100
```

**data.js**

```js
module.exports = async ({ id }) => {
    return await fetch("api/" + id).then((res) => res.json());
};
```

**\$fn run a local script to build the data to associate with the document**

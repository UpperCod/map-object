import { readFile } from "fs/promises";
import { join } from "path";
import loader from "./esm";

async function test() {
    let file = join(__dirname, "/test/files/a.yaml");
    let code = await readFile(file, "utf-8");
    let data = await loader({
        file,
        code,
        readFile: (src) => readFile(src, "utf-8"),
    });
    console.log(data);
}

test();

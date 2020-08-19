import { readFile } from "fs/promises";
import { join } from "path";
import test from "ava";
import loader from "../esm";

test("simple replace", async (t) => {
    const dataCompare = {
        b: { name: "b" },
        a: 1,
        c: "b",
        users: [{ name: "Matias", alias: "@uppercod", text: "lorem...\n" }],
        get: ["a", "b"],
    };

    let file = join(__dirname, "files/a.yaml");
    let code = await readFile(file, "utf-8");
    let data = await loader({
        file,
        code,
        readFile: (src) => readFile(src, "utf-8"),
    });

    t.is(JSON.stringify(data), JSON.stringify(dataCompare));
});

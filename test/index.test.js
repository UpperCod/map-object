import { readFile } from "fs/promises";
import { join } from "path";
import test from "ava";
import loader from "../esm";
import { ref } from "./plugin-ref";

const dataCompare = {
    b: { name: "b" },
    label: "e",
    a: {
        b: { name: "b" },
        a: 1,
        c: "b",
        users: [{ name: "Matias", alias: "@uppercod", text: "lorem...\n" }],
    },
};

test("simple replace", async (t) => {
    const file = join(__dirname, "files/e.yaml");
    const code = await readFile(file, "utf-8");

    const getData = () =>
        loader(
            {
                file,
                code,
            },
            { ref }
        );

    t.deepEqual(await getData(), dataCompare);
    t.deepEqual(await getData(), dataCompare);
    t.deepEqual(await getData(), dataCompare);
    t.deepEqual(await getData(), dataCompare);
});

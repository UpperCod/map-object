import test from "ava";
import path from "path";
import { readFile } from "fs/promises";
import load from "../src";

async function $ref({ value, file }, { load }) {
    const { dir } = path.parse(file);
    const src = path.join(dir, value);
    return load({
        file: src,
        value: JSON.parse(await readFile(src, "utf-8")),
    });
}

test("load", async (t) => {
    const file = path.join(__dirname, "data.json");
    const { value } = await load(
        {
            file,
            value: {
                users: { $ref: "./files/users.json" },
            },
        },
        { $ref }
    );

    t.deepEqual(value, {
        users: [
            {
                name: "Matias",
                alias: "@uppercod",
            },
            {
                name: "Matias",
                alias: "@uppercod",
            },
            {
                name: "Matias",
                alias: "@uppercod",
            },
        ],
    });
});

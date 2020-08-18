import * as Interal from "./internal";

declare module "@uppercod/yaml" {
    interface config {
        file: string;
        code: string;
        readFile: (src: string) => any;
    }

    export default function parse(
        config: config,
        parallel?: Object
    ): Promise<any>;
}

import { Context } from "@uppercod/imported";

interface ObjectFill {
    [index: string]: any;
}

declare module "@uppercod/map-object" {
    export interface Data {
        file: string;
        value: ObjectFill | ObjectFill[];
        root: ObjectFill | ObjectFill[];
        tree?: Context;
    }
    export default function load(
        data: Data,
        maps,
        parallel: ObjectFill
    ): Promise<Data>;

    export type Plugin = (
        data: Data,
        load: (data: Data) => Promise<ObjectFill | ObjectFill[]>
    ) => Promise<ObjectFill>;
}

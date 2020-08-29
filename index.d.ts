import { Context } from "@uppercod/imported";

interface ObjectFill {
    [index: string]: any;
}

declare module "@uppercod/map-object" {
    export interface Data {
        file: string;
        value: any;
        root?: ObjectFill | ObjectFill[];
        tree?: Context;
    }
    export default function load(
        data: Data,
        maps: Plugins,
        parallel?: ObjectFill
    ): Promise<Data>;

    export interface PluginContext {
        load(data: Data): Promise<ObjectFill | ObjectFill[]>;
    }

    export type Plugin = (
        data: Data,
        context: PluginContext
    ) => Promise<ObjectFill>;

    export interface Plugins {
        [prop: string]: Plugin;
    }
}

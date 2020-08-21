declare module "@uppercod/yaml" {
    interface Return {
        file: string;
        value: any;
        after?: (data: any) => any;
    }

    interface config {
        file: string;
        code: string;
    }

    interface Props {
        [fn: string]: (
            value: any,
            data: any,
            file: string
        ) => Return | Promise<Return>;
    }

    export default function parse(config: config, props: Props): Promise<any>;
}

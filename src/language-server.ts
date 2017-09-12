import { ServeOptions, serve } from "./server";
const program = require("commander");

const packageJson = require("../package.json");
const defaultLspPort = 2089;

program
    .version(packageJson.version)
    .option("-p, --port [port]', 'specifies LSP port to use (" + defaultLspPort + ")", parseInt)
    .parse(process.argv);

const options: ServeOptions = {
    lspPort: program.port || defaultLspPort
};

serve(options);

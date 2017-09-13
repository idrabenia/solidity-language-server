import { ServeOptions, serve } from "./server";
const program = require("commander");

const numCPUs = require("os").cpus().length;
const packageJson = require("../package.json");
const defaultLspPort = 2089;

program
    .version(packageJson.version)
    .option("-p, --port [port]', 'specifies LSP port to use (" + defaultLspPort + ")", parseInt)
    .option("-c, --cluster [num]", "number of concurrent cluster workers (defaults to number of CPUs, " + numCPUs + ")", parseInt)
    .parse(process.argv);

const options: ServeOptions = {
    clusterSize: program.cluster || numCPUs,
    lspPort: program.port || defaultLspPort
};

serve(options);

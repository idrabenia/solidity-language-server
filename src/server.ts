import * as cluster from "cluster";

import { MessageLogOptions } from "./connection";
import { Logger, PrefixedLogger, StdioLogger } from "./logging";

/**
 * Creates a Logger prefixed with master or worker ID
 *
 * @param logger An optional logger to wrap, e.g. to write to a logfile. Defaults to STDIO
 */
export function createClusterLogger(logger = new StdioLogger()): Logger {
    return new PrefixedLogger(logger, cluster.isMaster ? "master" : `wrkr ${cluster.worker.id}`);
}

/** Options to `serve()` */
export interface ServeOptions extends MessageLogOptions {
    /** Port to listen on for TCP LSP connections */
    lspPort: number;
}

export function serve(options: ServeOptions) {
    const logger = options.logger || createClusterLogger();
    logger.info(`Listening for incoming LSP connections on ${options.lspPort}`);
}

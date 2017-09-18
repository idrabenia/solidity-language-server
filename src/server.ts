import * as cluster from "cluster";
import * as net from "net";

import { isNotificationMessage } from "vscode-jsonrpc/lib/messages";

import { MessageEmitter, MessageLogOptions } from "./connection";
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
    /** Amount of workers to spawn */
    clusterSize: number;

    /** Port to listen on for TCP LSP connections */
    lspPort: number;
}

/**
 * Starts up a cluster of worker processes that listen on the same TCP socket.
 * Crashing workers are restarted automatically.
 *
 * @param options
 */
export function serve(options: ServeOptions) {
    const logger = options.logger || createClusterLogger();
    if (options.clusterSize > 1 && cluster.isMaster) {
        logger.log(`Spawning ${options.clusterSize} workers`);
        cluster.on("online", worker => {
            logger.log(`Worker ${worker.id} (PID ${worker.process.pid}) online`);
        });
        cluster.on("exit", (worker, code, signal) => {
            logger.error(`Worker ${worker.id} (PID ${worker.process.pid}) exited from signal ${signal} with code ${code}, restarting`);
            cluster.fork();
        });
        for (let i = 0; i < options.clusterSize; ++i) {
            cluster.fork();
        }
    } else {
        let counter = 1;
        const server = net.createServer(socket => {
            const id = counter++;
            logger.log(`Connection ${id} accepted`);

            const messageEmitter = new MessageEmitter(socket as NodeJS.ReadableStream, options);

            // Add exit notification handler to close the socket on exit
            messageEmitter.on("message", message => {
                if (isNotificationMessage(message) && message.method === "exit") {
                    socket.end();
                    socket.destroy();
                    logger.log(`Connection ${id} closed (exit notification)`);
                }
            });
        });

        server.listen(options.lspPort, () => {
            logger.info(`Listening for incoming LSP connections on ${options.lspPort}`);
        });
    }
}

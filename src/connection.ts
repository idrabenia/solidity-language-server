import { EventEmitter } from "events";

import { Message, StreamMessageReader as VSCodeStreamMessageReader } from "vscode-jsonrpc";

import { Logger } from "./logging";

export interface MessageLogOptions {
    /** Logger to use */
    logger?: Logger;

    /** Whether to log all messages */
    logMessages?: boolean;
}

/**
 * Takes a NodeJS ReadableStream and emits parsed messages received on the stream.
 * In opposite to StreamMessageReader, supports multiple listeners and is compatible with Observables
 */
export class MessageEmitter extends EventEmitter {

    constructor(input: NodeJS.ReadableStream, options: MessageLogOptions = {}) {
        super();
        const reader = new VSCodeStreamMessageReader(input);
        // Forward events
        reader.listen(msg => {
            this.emit("message", msg);
        });
        reader.onError(err => {
            this.emit("error", err);
        });
        reader.onClose(() => {
            this.emit("close");
        });
        this.setMaxListeners(Infinity);
        // Register message listener to log messages if configured
        if (options.logMessages && options.logger) {
            const logger = options.logger;
            this.on("message", message => {
                logger.log("-->", message);
            });
        }
    }

    /** Emitted when a new JSON RPC message was received on the input stream */
    on(event: "message", listener: (message: Message) => void): this;
    /** Emitted when the underlying input stream emitted an error */
    on(event: "error", listener: (error: Error) => void): this;
    /** Emitted when the underlying input stream was closed */
    on(event: "close", listener: () => void): this;
    /* istanbul ignore next */
    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /** Emitted when a new JSON RPC message was received on the input stream */
    once(event: "message", listener: (message: Message) => void): this;
    /** Emitted when the underlying input stream emitted an error */
    once(event: "error", listener: (error: Error) => void): this;
    /** Emitted when the underlying input stream was closed */
    once(event: "close", listener: () => void): this;
    /* istanbul ignore next */
    once(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }
}

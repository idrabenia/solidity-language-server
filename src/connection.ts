import { Logger } from "./logging";

export interface MessageLogOptions {
    /** Logger to use */
    logger?: Logger;

    /** Whether to log all messages */
    logMessages?: boolean;
}

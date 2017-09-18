import { NotificationMessage } from "vscode-jsonrpc/lib/messages";
import {
    LogMessageParams,
    PublishDiagnosticsParams,
} from "vscode-languageserver";

import { MessageWriter } from "./connection";

export interface LanguageClient {
    /**
	 * The log message notification is sent from the server to the client to ask
	 * the client to log a particular message.
	 */
    windowLogMessage(params: LogMessageParams): void;

    /**
	 * Diagnostics are sent from the server to the client to notify the user of errors/warnings
	 * in a source file
	 * @param params The diagnostics to send to the client
	 */
    textDocumentPublishDiagnostics(params: PublishDiagnosticsParams): void;
}

/**
 * Provides an interface to call methods on the remote client.
 * Methods are named after the camelCase version of the LSP method name
 */
export class RemoteLanguageClient {

    /**
	 * @param output MessageWriter to write requests/notifications to
	 */
    constructor(private output: MessageWriter) { }

    /**
	 * Sends a Notification
	 *
	 * @param method The method to notify
	 * @param params The params to pass to the method
	 */
    private notify(method: string, params: any[] | { [attr: string]: any }): void {
        const message: NotificationMessage = { jsonrpc: "2.0", method, params };
        this.output.write(message);
    }

    /**
	 * The log message notification is sent from the server to the client to ask
	 * the client to log a particular message.
	 */
    windowLogMessage(params: LogMessageParams): void {
        this.notify("window/logMessage", params);
    }

    /**
	 * Diagnostics are sent from the server to the client to notify the user of errors/warnings
	 * in a source file
	 * @param params The diagnostics to send to the client
	 */
    textDocumentPublishDiagnostics(params: PublishDiagnosticsParams): void {
        this.notify("textDocument/publishDiagnostics", params);
    }
}

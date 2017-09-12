import {
    LogMessageParams,
    PublishDiagnosticsParams,
} from "vscode-languageserver";

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

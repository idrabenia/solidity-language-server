import { Observable } from "@reactivex/rxjs";
import { Operation } from "fast-json-patch";
import * as _ from "lodash";
import {
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    DidCloseTextDocumentParams,
    DidOpenTextDocumentParams,
    DidSaveTextDocumentParams,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind
} from "vscode-languageserver";

import { getDiagnostics } from "./diagnostic";
import { LanguageClient } from "./language-client";
import { LSPLogger, Logger } from "./logging";
import { InMemoryFileSystem } from "./memfs";
import { ProjectManager } from "./project-manager";
import { soliumDefaultRules } from "./solidity-linter";
import { normalizeUri, path2uri, uri2path } from "./util";

export interface SolidityServiceOptions {
}

/**
 * Settings synced through `didChangeConfiguration`
 */
export interface Settings {
    soliumRules: any;
}

export class SolidityService {
    projectManager: ProjectManager;

    /**
     * The rootPath as passed to `initialize` or converted from `rootUri`
     */
    root: string;

    /**
     * The root URI as passed to `initialize` or converted from `rootPath`
     */
    protected rootUri: string;

    protected logger: Logger;

    /**
     * Holds file contents and workspace structure in memory
     */
    protected inMemoryFileSystem: InMemoryFileSystem;

    /**
     * Settings synced though `didChangeConfiguration`
     */
    protected settings: Settings = {
        soliumRules: soliumDefaultRules
    };

    constructor(protected client: LanguageClient, protected options: SolidityServiceOptions = {}) {
        this.logger = new LSPLogger(client);
    }

    initialize(params: InitializeParams): Observable<Operation> {
        if (params.rootUri || params.rootPath) {
            this.root = params.rootPath || uri2path(params.rootUri!);
            this.rootUri = params.rootUri || path2uri(params.rootPath!);

            // The root URI always refers to a directory
            if (!this.rootUri.endsWith("/")) {
                this.rootUri += "/";
            }
            this._initializeFileSystems();
            this.projectManager = new ProjectManager(
                this.root,
                this.inMemoryFileSystem,
                this.logger
            );
        }
        const result: InitializeResult = {
            capabilities: {
                // Tell the client that the server works in FULL text document sync mode
                textDocumentSync: TextDocumentSyncKind.Full,
                hoverProvider: true,
                signatureHelpProvider: {
                    triggerCharacters: ["(", ","]
                },
                definitionProvider: true,
                referencesProvider: true,
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                completionProvider: {
                    resolveProvider: true,
                    triggerCharacters: ["."]
                },
                codeActionProvider: true,
                renameProvider: true,
                executeCommandProvider: {
                    commands: []
                }
            }
        };
        return Observable.of({
            op: "add",
            path: "",
            value: result
        } as Operation);
    }

    /**
     * The initialized notification is sent from the client to the server after the client received the
     * result of the initialize request but before the client is sending any other request or notification
     * to the server. The server can use the initialized notification for example to dynamically register
     * capabilities.
     */
    async initialized(): Promise<void> {
        // No op.
    }

    protected _initializeFileSystems(): void {
        this.inMemoryFileSystem = new InMemoryFileSystem(this.root, this.logger);
    }

    /**
     * The shutdown request is sent from the client to the server. It asks the server to shut down,
     * but to not exit (otherwise the response might not be delivered correctly to the client).
     * There is a separate exit notification that asks the server to exit.
     *
     * @return Observable of JSON Patches that build a `null` result
     */
    shutdown(_params = {}): Observable<Operation> {
        return Observable.of({ op: "add", path: "", value: null } as Operation);
    }

    /**
     * A notification sent from the client to the server to signal the change of configuration
     * settings.
     */
    workspaceDidChangeConfiguration(params: DidChangeConfigurationParams): void {
        _.merge(this.settings, params.settings);
    }

    /**
     * The document open notification is sent from the client to the server to signal newly opened
     * text documents. The document's truth is now managed by the client and the server must not try
     * to read the document's truth using the document's uri.
     */
    async textDocumentDidOpen(params: DidOpenTextDocumentParams): Promise<void> {
        const uri = normalizeUri(params.textDocument.uri);
        const text = params.textDocument.text;
        // Ensure files needed for most operations are fetched
        this.projectManager.didOpen(uri, text);
        await new Promise(resolve => setTimeout(resolve, 200));
        this._publishDiagnostics(uri, text);
    }

    /**
     * The document change notification is sent from the client to the server to signal changes to a
     * text document. In 2.0 the shape of the params has changed to include proper version numbers
     * and language ids.
     */
    async textDocumentDidChange(params: DidChangeTextDocumentParams): Promise<void> {
        const uri = normalizeUri(params.textDocument.uri);
        let text: string | undefined;
        for (const change of params.contentChanges) {
            if (change.range || change.rangeLength) {
                throw new Error("incremental updates in textDocument/didChange not supported for file " + uri);
            }
            text = change.text;
        }
        if (!text) {
            return;
        }
        this.projectManager.didChange(uri, text);
        await new Promise(resolve => setTimeout(resolve, 200));
        this._publishDiagnostics(uri, text);
    }

    /**
     * The document save notification is sent from the client to the server when the document was
     * saved in the client.
     */
    async textDocumentDidSave(params: DidSaveTextDocumentParams): Promise<void> {
        const uri = normalizeUri(params.textDocument.uri);

        this.projectManager.didSave(uri);
    }

    /**
     * The document close notification is sent from the client to the server when the document got
     * closed in the client. The document's truth now exists where the document's uri points to
     * (e.g. if the document's uri is a file uri the truth now exists on disk).
     */
    async textDocumentDidClose(params: DidCloseTextDocumentParams): Promise<void> {
        const uri = normalizeUri(params.textDocument.uri);

        this.projectManager.didClose(uri);

        // Clear diagnostics
        this.client.textDocumentPublishDiagnostics({ uri, diagnostics: [] });
    }

    /**
     * Generates and publishes diagnostics for a given file
     *
     * @param uri URI of the file to check
     */
    private _publishDiagnostics(uri: string, text: string): void {
        const diagnostics = getDiagnostics(uri2path(uri), text);
        this.client.textDocumentPublishDiagnostics({ uri, diagnostics });
    }
}

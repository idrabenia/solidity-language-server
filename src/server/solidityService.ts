import { Observable } from "@reactivex/rxjs";
import { Operation } from "fast-json-patch";
import * as _ from "lodash";
import {
    CompletionList,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    DidCloseTextDocumentParams,
    DidOpenTextDocumentParams,
    DidSaveTextDocumentParams,
    InitializeResult,
    TextDocumentPositionParams,
    TextDocumentSyncKind
} from "vscode-languageserver";

import { soliumDefaultRules } from "../compiler/program";
import { FileSystem, FileSystemUpdater, LocalFileSystem, RemoteFileSystem } from "./fs";
import { LanguageClient } from "./languageClient";
import { LSPLogger, Logger } from "./logging";
import { InMemoryFileSystem } from "./memfs";
import { ProjectManager } from "./projectManager";
import { InitializeParams } from "./requestType";
import { normalizeUri, path2uri, uri2path } from "./utilities";

export interface SolidityServiceOptions {
}

/**
 * Settings synced through `didChangeConfiguration`
 */
export interface Settings {
    soliumRules: any;
}

export class SolidityService {
    public projectManager: ProjectManager;

    /**
     * The rootPath as passed to `initialize` or converted from `rootUri`
     */
    public root: string;

    /**
     * The root URI as passed to `initialize` or converted from `rootPath`
     */
    protected rootUri: string;

    protected logger: Logger;

    /**
     * The remote (or local), asynchronous, file system to fetch files from
     */
    protected fileSystem: FileSystem;

    /**
     * Holds file contents and workspace structure in memory
     */
    protected inMemoryFileSystem: InMemoryFileSystem;

    /**
     * Syncs the remote file system with the in-memory file system
     */
    protected updater: FileSystemUpdater;

    /**
     * Settings synced though `didChangeConfiguration`
     */
    protected settings: Settings = {
        soliumRules: soliumDefaultRules
    };

    constructor(protected client: LanguageClient, protected options: SolidityServiceOptions = {}) {
        this.logger = new LSPLogger(client);
    }

    public initialize(params: InitializeParams): Observable<Operation> {
        if (params.rootUri || params.rootPath) {
            this.root = params.rootPath || uri2path(params.rootUri!);
            this.rootUri = params.rootUri || path2uri(params.rootPath!);

            // The root URI always refers to a directory
            if (!this.rootUri.endsWith("/")) {
                this.rootUri += "/";
            }
            this._initializeFileSystems(!(params.capabilities.xcontentProvider && params.capabilities.xfilesProvider));
            this.updater = new FileSystemUpdater(this.fileSystem, this.inMemoryFileSystem);
            this.projectManager = new ProjectManager(
                this.root,
                this.inMemoryFileSystem,
                this.updater,
                this.logger
            );
        }
        const result: InitializeResult = {
            capabilities: {
                // Tell the client that the server works in FULL text document sync mode
                textDocumentSync: TextDocumentSyncKind.Full,
                hoverProvider: false,
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
                codeActionProvider: false,
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
    public async initialized(): Promise<void> {
        // No op.
    }

    /**
     * Initializes the remote file system and in-memory file system.
     * Can be overridden
     *
     * @param accessDisk Whether the language server is allowed to access the local file system
     */
    protected _initializeFileSystems(accessDisk: boolean): void {
        this.fileSystem = accessDisk ? new LocalFileSystem(this.rootUri) : new RemoteFileSystem(this.client);
        this.inMemoryFileSystem = new InMemoryFileSystem(this.root, this.logger);
    }

    /**
     * The shutdown request is sent from the client to the server. It asks the server to shut down,
     * but to not exit (otherwise the response might not be delivered correctly to the client).
     * There is a separate exit notification that asks the server to exit.
     *
     * @return Observable of JSON Patches that build a `null` result
     */
    public shutdown(_params = {}): Observable<Operation> {
        return Observable.of({ op: "add", path: "", value: null } as Operation);
    }

    /**
     * A notification sent from the client to the server to signal the change of configuration
     * settings.
     */
    public workspaceDidChangeConfiguration(params: DidChangeConfigurationParams): void {
        _.merge(this.settings, params.settings);
    }

    /**
     * The document open notification is sent from the client to the server to signal newly opened
     * text documents. The document's truth is now managed by the client and the server must not try
     * to read the document's truth using the document's uri.
     */
    public async textDocumentDidOpen(params: DidOpenTextDocumentParams): Promise<void> {
        const uri = normalizeUri(params.textDocument.uri);
        const text = params.textDocument.text;
        // Ensure files needed for most operations are fetched
        await this.projectManager.ensureReferencedFiles(uri).toPromise();
        this.projectManager.didOpen(uri, text);
        await new Promise(resolve => setTimeout(resolve, 200));
        this._publishDiagnostics(uri);
    }

    /**
     * The document change notification is sent from the client to the server to signal changes to a
     * text document. In 2.0 the shape of the params has changed to include proper version numbers
     * and language ids.
     */
    public async textDocumentDidChange(params: DidChangeTextDocumentParams): Promise<void> {
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
        this._publishDiagnostics(uri);
    }

    /**
     * The document save notification is sent from the client to the server when the document was
     * saved in the client.
     */
    public async textDocumentDidSave(params: DidSaveTextDocumentParams): Promise<void> {
        const uri = normalizeUri(params.textDocument.uri);
        await this.projectManager.ensureReferencedFiles(uri).toPromise();
        this.projectManager.didSave(uri);
    }

    /**
     * The document close notification is sent from the client to the server when the document got
     * closed in the client. The document's truth now exists where the document's uri points to
     * (e.g. if the document's uri is a file uri the truth now exists on disk).
     */
    public async textDocumentDidClose(params: DidCloseTextDocumentParams): Promise<void> {
        const uri = normalizeUri(params.textDocument.uri);

        // Ensure files needed to suggest completions are fetched
        await this.projectManager.ensureReferencedFiles(uri).toPromise();

        this.projectManager.didClose(uri);

        // Clear diagnostics
        this.client.textDocumentPublishDiagnostics({ uri, diagnostics: [] });
    }

    /**
     * Generates and publishes diagnostics for a given file
     *
     * @param uri URI of the file to check
     */
    private _publishDiagnostics(uri: string): void {
        const config = this.projectManager.getParentConfiguration(uri);
        if (!config) {
            return;
        }
        const fileName = uri2path(uri);
        const diagnostics = config.getService().getCompilerDiagnostics(fileName).concat(config.getService().getLinterDiagnostics(fileName, this.settings.soliumRules));
        this.client.textDocumentPublishDiagnostics({ uri, diagnostics });
    }

    /**
     * The Completion request is sent from the client to the server to compute completion items at a
     * given cursor position. Completion items are presented in the
     * [IntelliSense](https://code.visualstudio.com/docs/editor/editingevolved#_intellisense) user
     * interface. If computing full completion items is expensive, servers can additionally provide
     * a handler for the completion item resolve request ('completionItem/resolve'). This request is
     * sent when a completion item is selected in the user interface. A typically use case is for
     * example: the 'textDocument/completion' request doesn't fill in the `documentation` property
     * for returned completion items since it is expensive to compute. When the item is selected in
     * the user interface then a 'completionItem/resolve' request is sent with the selected
     * completion item as a param. The returned completion item should have the documentation
     * property filled in.
     *
     * @return Observable of JSON Patches that build a `CompletionList` result
     */
    public textDocumentCompletion(params: TextDocumentPositionParams): Observable<Operation> {
        const uri = normalizeUri(params.textDocument.uri);

        // Ensure files needed to suggest completions are fetched
        return this.projectManager.ensureReferencedFiles(uri, undefined, undefined)
            .toArray()
            .mergeMap(() => {
                const fileName: string = uri2path(uri);

                const configuration = this.projectManager.getConfiguration(fileName);
                configuration.ensureConfigFile();

                const completions = configuration.getService().getCompletionsAtPosition(fileName, params.position);

                return Observable.from(completions)
                    .map(item => {
                        return { op: "add", path: "/items/-", value: item } as Operation;
                    })
                    .startWith({ op: "add", path: "/isIncomplete", value: false } as Operation);
            })
            .startWith({ op: "add", path: "", value: { isIncomplete: true, items: [] } as CompletionList } as Operation);
    }
}

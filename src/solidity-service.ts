import {
    DidChangeTextDocumentParams,
    DidCloseTextDocumentParams,
    DidOpenTextDocumentParams,
    DidSaveTextDocumentParams,
    InitializeParams
} from "vscode-languageserver";

import { LanguageClient } from "./language-client";
import { LSPLogger, Logger } from "./logging";
import { InMemoryFileSystem } from "./memfs";
import { ProjectManager } from "./project-manager";
import { normalizeUri, path2uri, uri2path } from "./util";

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

    constructor(protected client: LanguageClient) {
        this.logger = new LSPLogger(client);
    }

    initialize(params: InitializeParams) {
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
    }

    protected _initializeFileSystems(): void {
        this.inMemoryFileSystem = new InMemoryFileSystem(this.root, this.logger);
    }


    /**
     * The document open notification is sent from the client to the server to signal newly opened
     * text documents. The document's truth is now managed by the client and the server must not try
     * to read the document's truth using the document's uri.
     */
    async textDocumentDidOpen(params: DidOpenTextDocumentParams): Promise<void> {
        const uri = normalizeUri(params.textDocument.uri);
        // Ensure files needed for most operations are fetched
        this.projectManager.didOpen(uri, params.textDocument.text);
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
}

import { InitializeParams } from "vscode-languageserver";

import { LanguageClient } from "./language-client";
import { LSPLogger, Logger } from "./logging";
import { InMemoryFileSystem } from "./memfs";
import { path2uri, uri2path } from "./util";

export class SolidityService {
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
        }
    }

    protected _initializeFileSystems(): void {
        this.inMemoryFileSystem = new InMemoryFileSystem(this.root, this.logger);
    }
}

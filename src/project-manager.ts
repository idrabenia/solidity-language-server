import { Logger, NoopLogger } from "./logging";
import { InMemoryFileSystem } from "./memfs";

export class ProjectManager {
    /**
     * Root path with slashes
     */
    private rootPath: string;

    /**
     * URI -> version map. Every time file content is about to change or changed (didChange/didOpen/...), we are incrementing it's version
     * signalling that file is changed and file's user must invalidate cached and requery file content
     */
    private versions: Map<string, number>;

    /**
     * Local side of file content provider which keeps cache of fetched files
     */
    private inMemoryFs: InMemoryFileSystem;

    /**
     * @param rootPath root path as passed to `initialize`
     * @param inMemoryFileSystem File system that keeps structure and contents in memory
     */
    constructor(
        rootPath: string,
        inMemoryFileSystem: InMemoryFileSystem,
        protected logger: Logger = new NoopLogger()
    ) {
        this.rootPath = rootPath;
        this.inMemoryFs = inMemoryFileSystem;
    }

    /**
     * Called when file was opened by client. Current implementation
     * does not differenciates open and change events
     * @param uri file's URI
     * @param text file's content
     */
    didOpen(uri: string, text: string) {
        this.didChange(uri, text);
    }

    /**
     * Called when file was closed by client. Current implementation invalidates compiled version
     * @param uri file's URI
     */
    didClose(uri: string) {
        this.inMemoryFs.didClose(uri);
        let version = this.versions.get(uri) || 0;
        this.versions.set(uri, ++version);
    }

    /**
     * Called when file was changed by client. Current implementation invalidates compiled version
     * @param uri file's URI
     * @param text file's content
     */
    didChange(uri: string, text: string) {
        this.inMemoryFs.didChange(uri, text);
        let version = this.versions.get(uri) || 0;
        this.versions.set(uri, ++version);
    }

    /**
     * Called when file was saved by client
     * @param uri file's URI
     */
    didSave(uri: string) {
        this.inMemoryFs.didSave(uri);
    }
}

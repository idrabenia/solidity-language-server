import { Observable } from "@reactivex/rxjs";
import { Glob } from "glob";
import * as fs from "mz/fs";
import Semaphore from "semaphore-async-await";

import { InMemoryFileSystem } from "./memfs";
import { normalizeUri, uri2path } from "./util";

export interface FileSystem {
    /**
     * Returns all files in the workspace under base
     *
     * @param base A URI under which to search, resolved relative to the rootUri
     * @return An Observable that emits URIs
     */
    getWorkspaceFiles(base?: string): Observable<string>;

    /**
     * Returns the content of a text document
     *
     * @param uri The URI of the text document, resolved relative to the rootUri
     * @return An Observable that emits the text document content
     */
    getTextDocumentContent(uri: string): Observable<string>;
}

export class LocalFileSystem implements FileSystem {

    /**
     * @param rootUri The root URI that is used if `base` is not specified
     */
    constructor(private rootUri: string) { }

    /**
     * Converts the URI to an absolute path on the local disk
     */
    protected resolveUriToPath(uri: string): string {
        return uri2path(uri);
    }

    getWorkspaceFiles(base = this.rootUri): Observable<string> {
        if (!base.endsWith("/")) {
            base += "/";
        }
        const cwd = this.resolveUriToPath(base);
        return new Observable<string>(subscriber => {
            const globber = new Glob("*", {
                cwd,
                nodir: true,
                matchBase: true,
                follow: true
            });
            globber.on("match", (file: string) => {
                subscriber.next(normalizeUri(base + file));
            });
            globber.on("error", (err: any) => {
                subscriber.error(err);
            });
            globber.on("end", () => {
                subscriber.complete();
            });
            return () => {
                globber.abort();
            };
        });
    }

    getTextDocumentContent(uri: string): Observable<string> {
        const filePath = this.resolveUriToPath(uri);
        return Observable.fromPromise(fs.readFile(filePath, "utf8"));
    }
}


/**
 * Synchronizes a remote file system to an in-memory file system
 */
export class FileSystemUpdater {

    /**
     * Observable for a pending or completed structure fetch
     */
    private structureFetch?: Observable<never>;

    /**
     * Map from URI to Observable of pending or completed content fetch
     */
    private fetches = new Map<string, Observable<never>>();

    /**
     * Limits concurrent fetches to not fetch thousands of files in parallel
     */
    private concurrencyLimit = new Semaphore(100);

    constructor(private remoteFs: FileSystem, private inMemoryFs: InMemoryFileSystem) { }

    /**
     * Fetches the file content for the given URI and adds the content to the in-memory file system
     *
     * @param uri URI of the file to fetch
     * @return Observable that completes when the fetch is finished
     */
    fetch(uri: string): Observable<never> {
        // Limit concurrent fetches
        const observable = Observable.fromPromise(this.concurrencyLimit.wait())
            .mergeMap(() => this.remoteFs.getTextDocumentContent(uri))
            .do(content => {
                this.concurrencyLimit.signal();
                this.inMemoryFs.add(uri, content);
            }, _err => {
                this.fetches.delete(uri);
            })
            .ignoreElements()
            .publishReplay()
            .refCount() as Observable<never>;
        this.fetches.set(uri, observable);
        return observable;
    }

    /**
     * Returns a promise that is resolved when the given URI has been fetched (at least once) to the in-memory file system.
     * This function cannot be cancelled because multiple callers get the result of the same operation.
     *
     * @param uri URI of the file to ensure
     * @return Observable that completes when the file was fetched
     */
    ensure(uri: string): Observable<never> {
        return this.fetches.get(uri) || this.fetch(uri);
    }

    /**
     * Fetches the file/directory structure for the given directory from the remote file system and saves it in the in-memory file system
     */
    fetchStructure(): Observable<never> {
        const observable = this.remoteFs.getWorkspaceFiles(undefined)
            .do(uri => {
                this.inMemoryFs.add(uri);
            }, _err => {
                this.structureFetch = undefined;
            })
            .ignoreElements()
            .publishReplay()
            .refCount() as Observable<never>;
        this.structureFetch = observable;
        return observable;
    }

    /**
     * Returns a promise that is resolved as soon as the file/directory structure for the given directory has been synced
     * from the remote file system to the in-memory file system (at least once)
     *
     * @param span An OpenTracing span for tracing
     */
    ensureStructure(): Observable<never> {
        return this.structureFetch || this.fetchStructure();
    }

    /**
     * Invalidates the content fetch cache of a file.
     * The next call to `ensure` will do a refetch.
     *
     * @param uri URI of the file that changed
     */
    invalidate(uri: string): void {
        this.fetches.delete(uri);
    }

    /**
     * Invalidates the structure fetch cache.
     * The next call to `ensureStructure` will do a refetch.
     */
    invalidateStructure(): void {
        this.structureFetch = undefined;
    }
}

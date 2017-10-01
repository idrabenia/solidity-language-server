import * as vscode from "vscode-languageserver";

export interface TextDocumentContentParams {

    /**
     * The text document to receive the content for.
     */
    textDocument: vscode.TextDocumentIdentifier;
}

export interface WorkspaceFilesParams {

    /**
     * The URI of a directory to search.
     * Can be relative to the rootPath.
     * If not given, defaults to rootPath.
     */
    base?: string;
}

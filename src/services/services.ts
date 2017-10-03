import {
    CompletionItem,
    Diagnostic,
    Position
} from "vscode-languageserver";

import * as diagnostics from "../diagnostics";
import { ModuleResolutionHost } from "../types";
import * as completions from "./completions";
import { LanguageService, LanguageServiceHost } from "./types";

export function createLanguageService(host: LanguageServiceHost): LanguageService {
    function fileExists(fileName: string) {
        return host.fileExists && host.fileExists(fileName);
    }

    function readFile(fileName: string, _encoding?: string) {
        return host.readFile && host.readFile(fileName);
    }

    const moduleResolutionHost: ModuleResolutionHost = {
        fileExists,
        readFile
    };

    function getCompletionsAtPosition(fileName: string, position: Position): CompletionItem[] {
        return completions.getCompletionsAtPosition(host, fileName, position);
    }

    function getDiagnostics(fileName: string): Diagnostic[] {
        return diagnostics.getDiagnostics(moduleResolutionHost, fileName);
    }

    return {
        getCompletionsAtPosition,
        getDiagnostics
    };
}

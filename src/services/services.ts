import {
    CompletionItem,
    Diagnostic,
    Position
} from "vscode-languageserver";

import * as diagnostics from "../diagnostics";
import * as completions from "./completions";
import { LanguageService, LanguageServiceHost } from "./types";

export function createLanguageService(host: LanguageServiceHost): LanguageService {
    function getCompletionsAtPosition(fileName: string, position: Position): CompletionItem[] {
        return completions.getCompletionsAtPosition(host, fileName, position);
    }

    function getDiagnostics(fileName: string): Diagnostic[] {
        return diagnostics.getDiagnostics(host, fileName);
    }

    return {
        getCompletionsAtPosition,
        getDiagnostics
    };
}

import {
    CompletionItem,
    Position
} from "vscode-languageserver";

import * as completions from "./completions";
import { LanguageService, LanguageServiceHost } from "./types";

export function createLanguageService(host: LanguageServiceHost): LanguageService {
    function getCompletionsAtPosition(fileName: string, position: Position): CompletionItem[] {
        return completions.getCompletionsAtPosition(host, fileName, position);
    }

    return {
        getCompletionsAtPosition
    };
}

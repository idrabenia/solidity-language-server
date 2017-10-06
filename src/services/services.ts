import {
    CompletionItem,
    Diagnostic,
    Position
} from "vscode-languageserver";

import { returnFalse } from "../compiler/core";
import * as diagnostics from "../compiler/diagnostics";
import { createProgram, isProgramUptoDate } from "../compiler/program";
import { HasInvalidatedResolution, ModuleResolutionHost, Program } from "../compiler/types";
import * as completions from "./completions";
import { LanguageService, LanguageServiceHost } from "./types";

export function createLanguageService(host: LanguageServiceHost): LanguageService {
    let program: Program;
    let lastProjectVersion: string;

    function synchronizeHostData(): void {
        // perform fast check if host supports it
        if (host.getProjectVersion) {
            const hostProjectVersion = host.getProjectVersion();
            if (hostProjectVersion) {
                if (lastProjectVersion === hostProjectVersion) {
                    return;
                }

                lastProjectVersion = hostProjectVersion;
            }
        }

        const hasInvalidatedResolution: HasInvalidatedResolution = host.hasInvalidatedResolution || returnFalse;
        const rootFileNames = host.getScriptFileNames();

        // If the program is already up-to-date, we can reuse it
        if (isProgramUptoDate(program, rootFileNames, host.getCompilationSettings(), path => host.getScriptVersion(path), host.fileExists, hasInvalidatedResolution)) {
            return;
        }

        // IMPORTANT - It is critical from this moment onward that we do not check
        // cancellation tokens.  We are about to mutate source files from a previous program
        // instance.  If we cancel midway through, we may end up in an inconsistent state where
        // the program points to old source files that have been invalidated because of
        // incremental parsing.
        program = createProgram(rootFileNames, host.getCompilationSettings());
        return;
    }

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

    function getProgram(): Program {
        synchronizeHostData();

        return program;
    }

    function getCompletionsAtPosition(fileName: string, position: Position): CompletionItem[] {
        return completions.getCompletionsAtPosition(host, fileName, position);
    }

    function getDiagnostics(fileName: string): Diagnostic[] {
        return diagnostics.getDiagnostics(moduleResolutionHost, fileName);
    }

    return {
        getProgram,
        getCompletionsAtPosition,
        getDiagnostics
    };
}

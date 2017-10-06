import {
    CompletionItem,
    Diagnostic,
    Position
} from "vscode-languageserver";

import { returnFalse } from "../compiler/core";
import { createProgram, isProgramUptoDate } from "../compiler/program";
import { HasInvalidatedResolution, Program, SourceFile } from "../compiler/types";
import * as completions from "./completions";
import { LanguageService, LanguageServiceHost } from "./types";

export function createLanguageService(host: LanguageServiceHost): LanguageService {
    let program: Program;
    let lastProjectVersion: string;

    function getValidSourceFile(fileName: string): SourceFile {
        const sourceFile = program.getSourceFile(fileName);
        if (!sourceFile) {
            throw new Error("Could not find file: '" + fileName + "'.");
        }
        return sourceFile;
    }

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

    function getProgram(): Program {
        synchronizeHostData();

        return program;
    }

    function getCompletionsAtPosition(fileName: string, position: Position): CompletionItem[] {
        return completions.getCompletionsAtPosition(host, fileName, position);
    }

    /// Diagnostics
    function getCompilerDiagnostics(fileName: string): Diagnostic[] {
        synchronizeHostData();

        return program.getCompilerDiagnostics(getValidSourceFile(fileName)).slice();
    }

    function getLinterDiagnostics(fileName: string): Diagnostic[] {
        synchronizeHostData();

        return program.getLinterDiagnostics(getValidSourceFile(fileName)).slice();
    }

    return {
        getProgram,
        getCompletionsAtPosition,
        getCompilerDiagnostics,
        getLinterDiagnostics
    };
}

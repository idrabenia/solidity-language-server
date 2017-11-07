import { CharStream, Scanner, TokenName } from "language-solidity";

import { FileReference } from "../compiler/types";
import { PreProcessedFileInfo } from "./types";

export function preProcessFile(sourceText: string): PreProcessedFileInfo {
    const scanner = new Scanner(new CharStream(sourceText));
    const importedFiles: FileReference[] = [];

    function nextToken(): TokenName {
        return scanner.next();
    }

    function tokenText(): string {
        return scanner.currentLiteral;
    }

    function getFileReference() {
        const fileName = scanner.currentLiteral;
        const pos = scanner.currentLocation;
        return { fileName, pos: pos.start, end: pos.end };
    }

    function recordModuleName() {
        importedFiles.push(getFileReference());
    }

    /**
     * Returns true if at least one token was consumed from the stream
     */
    function tryConsumeImport(): boolean {
        let token = scanner.currentToken;
        if (token === TokenName.Import) {
            token = nextToken();
            if (token === TokenName.StringLiteral) {
                // import "mod";
                recordModuleName();
                return true;
            }
            else {
                if (token === TokenName.LBrace) {
                    token = nextToken();
                    // consume "{ a as B, c, d as D}" clauses
                    // make sure that it stops on EOF
                    while (token !== TokenName.RBrace && token !== TokenName.EOS) {
                        token = nextToken();
                    }

                    if (token === TokenName.RBrace) {
                        token = nextToken();
                        if (token === TokenName.StringLiteral && tokenText() === "from") {
                            token = nextToken();
                            if (token === TokenName.StringLiteral) {
                                // import {a as A} from "mod";
                                recordModuleName();
                            }
                        }
                    }
                }
                else if (token === TokenName.Mul) {
                    token = nextToken();
                    if (token === TokenName.As) {
                        token = nextToken();
                        if (token === TokenName.Identifier) {
                            token = nextToken();
                            if (token === TokenName.StringLiteral && tokenText() === "from") {
                                token = nextToken();
                                if (token === TokenName.StringLiteral) {
                                    // import * as NS from "mod"
                                    recordModuleName();
                                }
                            }
                        }
                    }
                }
            }

            return true;
        }

        return false;
    }

    function processImports(): void {
        scanner.resetSource(new CharStream(sourceText), "");
        nextToken();
        // Look for:
        //    import "mod";
        //    import {a as A } from "mod";
        //    import * as NS  from "mod"

        while (true) {
            if (scanner.currentToken === TokenName.EOS) {
                break;
            }

            if (tryConsumeImport()) {
                continue;
            }
            else {
                nextToken();
            }
        }

        scanner.reset();
    }

    processImports();
    return { importedFiles };
}

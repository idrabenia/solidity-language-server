import { EventEmitter } from "events";

import * as sinon from "sinon";
import { ErrorCodes } from "vscode-jsonrpc";

import { MessageEmitter, MessageWriter, registerLanguageHandler } from "../connection";
import { SolidityService } from "../solidity-service";

describe("connection", () => {
    describe("registerLanguageHandler()", () => {
        test("should return MethodNotFound error when the method does not exist on handler", async () => {
            const handler: SolidityService = Object.create(SolidityService.prototype);
            const emitter = new EventEmitter();
            const writer = {
                write: sinon.spy()
            };
            registerLanguageHandler(emitter as MessageEmitter, writer as any as MessageWriter, handler as SolidityService);
            const params = [1, 1];
            emitter.emit("message", { jsonrpc: "2.0", id: 1, method: "whatever", params });
            sinon.assert.calledOnce(writer.write);
            sinon.assert.calledWithExactly(writer.write, sinon.match({ jsonrpc: "2.0", id: 1, error: { code: ErrorCodes.MethodNotFound } }));
        });
    });
});

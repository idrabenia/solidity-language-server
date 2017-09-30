import * as _ from "lodash";
import {
    CompletionItem,
    CompletionItemKind
} from "vscode-languageserver";

export function globalFunctionCompletions(): CompletionItem[] {
    return [
        {
            detail: "assert(bool condition): throws if the condition is not met - to be used for internal errors.",
            insertText: "assert(${1:condition});",
            insertTextFormat: 2,
            kind: CompletionItemKind.Function,
            label: "assert",
        },
        {
            detail: "require(bool condition): throws if the condition is not met - to be used for errors in inputs or external components.",
            insertText: "require(${1:condition});",
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: "require",
        },
        {
            detail: "revert(): abort execution and revert state changes",
            insertText: "revert();",
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: "revert",
        },
        {
            detail: "addmod(uint x, uint y, uint k) returns (uint):" +
            "compute (x + y) % k where the addition is performed with arbitrary precision and does not wrap around at 2**256",
            insertText: "addmod(${1:x},${2:y},${3:k})",
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: "addmod",
        },
        {
            detail: "mulmod(uint x, uint y, uint k) returns (uint):" +
            "compute (x * y) % k where the multiplication is performed with arbitrary precision and does not wrap around at 2**256",
            insertText: "mulmod(${1:x},${2:y},${3:k})",
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: "mulmod",
        },
        {
            detail: "keccak256(...) returns (bytes32):" +
            "compute the Ethereum-SHA-3 (Keccak-256) hash of the (tightly packed) arguments",
            insertText: "keccak256(${1:x})",
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: "keccak256",
        },
        {
            detail: "sha256(...) returns (bytes32):" +
            "compute the SHA-256 hash of the (tightly packed) arguments",
            insertText: "sha256(${1:x})",
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: "sha256",
        },
        {
            detail: "sha3(...) returns (bytes32):" +
            "alias to keccak256",
            insertText: "sha3(${1:x})",
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: "sha3",
        },
        {
            detail: "ripemd160(...) returns (bytes20):" +
            "compute RIPEMD-160 hash of the (tightly packed) arguments",
            insertText: "ripemd160(${1:x})",
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: "ripemd160",
        },
        {
            detail: "ecrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) returns (address):" +
            "recover the address associated with the public key from elliptic curve signature or return zero on error",
            insertText: "ecrecover(${1:hash},${2:v},${3:r},${4:s})",
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: "ecrecover",
        },
    ];
}

export function globalVariableCompletions(): CompletionItem[] {
    return [
        {
            detail: "Current block",
            kind: CompletionItemKind.Variable,
            label: "block",
        },
        {
            detail: "Current message",
            kind: CompletionItemKind.Variable,
            label: "msg",
        },
        {
            detail: "(uint): current block timestamp (alias for block.timestamp)",
            kind: CompletionItemKind.Variable,
            label: "now",
        },
        {
            detail: "Current transaction",
            kind: CompletionItemKind.Variable,
            label: "tx",
        },
    ];
}

export function typeCompletions(): CompletionItem[] {
    const types = ["address", "string", "bytes", "byte", "int", "uint", "bool", "hash"];
    return types.map(type => {
        const item = CompletionItem.create(type);
        item.kind = CompletionItemKind.Keyword;
        item.detail = type + " type";
        return item;
    });
}

export function unitCompletions(): CompletionItem[] {
    const etherUnits = ["wei", "finney", "szabo", "ether"];
    const etherUnitCompletions = etherUnits.map(etherUnit => {
        const item = CompletionItem.create(etherUnit);
        item.kind = CompletionItemKind.Unit;
        item.detail = etherUnit + ": ether unit";
        return item;
    });

    const timeUnits = ["seconds", "minutes", "hours", "days", "weeks", "years"];
    const timeUnitCompletions = timeUnits.map(timeUnit => {
        const item = CompletionItem.create(timeUnit);
        item.kind = CompletionItemKind.Unit;
        item.detail = timeUnit + ": time unit";
        return item;
    });

    return _.concat(etherUnitCompletions, timeUnitCompletions);
}

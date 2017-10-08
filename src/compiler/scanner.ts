import { Debug, binarySearch, createMapFromTemplate } from "./core";
import {
    CharacterCodes,
    LineAndCharacter,
    Map,
    NumericLiteralFlags,
    SourceFile,
    SourceFileLike,
    SyntaxKind
} from "./types";

export interface ErrorCallback {
    (message: string, length: number): void;
}

export interface Scanner {
    getStartPos(): number;
    getToken(): SyntaxKind;
    getTextPos(): number;
    getTokenPos(): number;
    getTokenText(): string;
    getTokenValue(): string;
    hasExtendedUnicodeEscape(): boolean;
    hasPrecedingLineBreak(): boolean;
    isIdentifier(): boolean;
    isReservedWord(): boolean;
    isUnterminated(): boolean;
    /* @internal */
    getNumericLiteralFlags(): NumericLiteralFlags;
    reScanGreaterToken(): SyntaxKind;
    scan(): SyntaxKind;
    getText(): string;
    // Sets the text for the scanner to scan.  An optional subrange starting point and length
    // can be provided to have the scanner only scan a portion of the text.
    setText(text: string, start?: number, length?: number): void;
    setOnError(onError: ErrorCallback): void;
    setTextPos(textPos: number): void;
}

const textToToken = createMapFromTemplate({
    "abstract": SyntaxKind.AbstractKeyword,
    "address": SyntaxKind.AddressKeyword,
    "after": SyntaxKind.AfterKeyword,
    "anonymous": SyntaxKind.AnonymousKeyword,
    "as": SyntaxKind.AsKeyword,
    "assembly": SyntaxKind.AssemblyKeyword,
    "bool": SyntaxKind.BoolKeyword,
    "break": SyntaxKind.BreakKeyword,
    "byte": SyntaxKind.ByteKeyword,
    "bytes": SyntaxKind.BytesKeyword,
    "case": SyntaxKind.CaseKeyword,
    "catch": SyntaxKind.CatchKeyword,
    "constant": SyntaxKind.ConstantKeyword,
    "continue": SyntaxKind.ContinueKeyword,
    "contract": SyntaxKind.ContractKeyword,
    "days": SyntaxKind.DaysKeyword,
    "default": SyntaxKind.DefaultKeyword,
    "delete": SyntaxKind.DeleteKeyword,
    "do": SyntaxKind.DoKeyword,
    "else": SyntaxKind.ElseKeyword,
    "enum": SyntaxKind.EnumKeyword,
    "ether": SyntaxKind.EtherKeyword,
    "event": SyntaxKind.EventKeyword,
    "external": SyntaxKind.ExternalKeyword,
    "false": SyntaxKind.FalseKeyword,
    "final": SyntaxKind.FinalKeyword,
    "finney": SyntaxKind.FinneyKeyword,
    "fixed": SyntaxKind.FixedKeyword,
    "for": SyntaxKind.ForKeyword,
    "function": SyntaxKind.FunctionKeyword,
    "hex": SyntaxKind.HexKeyword,
    "hours": SyntaxKind.HoursKeyword,
    "if": SyntaxKind.IfKeyword,
    "import": SyntaxKind.ImportKeyword,
    "in": SyntaxKind.InKeyword,
    "indexed": SyntaxKind.IndexedKeyword,
    "inline": SyntaxKind.InlineKeyword,
    "int": SyntaxKind.IntKeyword,
    "interface": SyntaxKind.InterfaceKeyword,
    "internal": SyntaxKind.InternalKeyword,
    "is": SyntaxKind.IsKeyword,
    "let": SyntaxKind.LetKeyword,
    "library": SyntaxKind.LibraryKeyword,
    "mapping": SyntaxKind.MappingKeyword,
    "match": SyntaxKind.MatchKeyword,
    "memory": SyntaxKind.MemoryKeyword,
    "minutes": SyntaxKind.MinutesKeyword,
    "modifier": SyntaxKind.ModifierKeyword,
    "new": SyntaxKind.NewKeyword,
    "null": SyntaxKind.NullKeyword,
    "of": SyntaxKind.OfKeyword,
    "payable": SyntaxKind.PayableKeyword,
    "pragma": SyntaxKind.PragmaKeyword,
    "private": SyntaxKind.PrivateKeyword,
    "public": SyntaxKind.PublicKeyword,
    "pure": SyntaxKind.PureKeyword,
    "relocatable": SyntaxKind.RelocatableKeyword,
    "return": SyntaxKind.ReturnKeyword,
    "returns": SyntaxKind.ReturnsKeyword,
    "seconds": SyntaxKind.SecondsKeyword,
    "static": SyntaxKind.StaticKeyword,
    "storage": SyntaxKind.StorageKeyword,
    "string": SyntaxKind.StringKeyword,
    "struct": SyntaxKind.StructKeyword,
    "switch": SyntaxKind.SwitchKeyword,
    "szabo": SyntaxKind.SzaboKeyword,
    "this": SyntaxKind.ThisKeyword,
    "throw": SyntaxKind.ThrowKeyword,
    "true": SyntaxKind.TrueKeyword,
    "try": SyntaxKind.TryKeyword,
    "type": SyntaxKind.TypeKeyword,
    "typeof": SyntaxKind.TypeofKeyword,
    "ufixed": SyntaxKind.UfixedKeyword,
    "uint": SyntaxKind.UintKeyword,
    "using": SyntaxKind.UsingKeyword,
    "var": SyntaxKind.VarKeyword,
    "weeks": SyntaxKind.WeeksKeyword,
    "wei": SyntaxKind.WeiKeyword,
    "while": SyntaxKind.WhileKeyword,
    "years": SyntaxKind.YearsKeyword,
    "{": SyntaxKind.OpenBraceToken,
    "}": SyntaxKind.CloseBraceToken,
    "(": SyntaxKind.OpenParenToken,
    ")": SyntaxKind.CloseParenToken,
    "[": SyntaxKind.OpenBracketToken,
    "]": SyntaxKind.CloseBracketToken,
    ".": SyntaxKind.DotToken,
    "...": SyntaxKind.DotDotDotToken,
    ";": SyntaxKind.SemicolonToken,
    ",": SyntaxKind.CommaToken,
    "<": SyntaxKind.LessThanToken,
    ">": SyntaxKind.GreaterThanToken,
    "<=": SyntaxKind.LessThanEqualsToken,
    ">=": SyntaxKind.GreaterThanEqualsToken,
    "==": SyntaxKind.EqualsEqualsToken,
    "!=": SyntaxKind.ExclamationEqualsToken,
    "=>": SyntaxKind.EqualsGreaterThanToken,
    "+": SyntaxKind.PlusToken,
    "-": SyntaxKind.MinusToken,
    "**": SyntaxKind.AsteriskAsteriskToken,
    "*": SyntaxKind.AsteriskToken,
    "/": SyntaxKind.SlashToken,
    "%": SyntaxKind.PercentToken,
    "++": SyntaxKind.PlusPlusToken,
    "--": SyntaxKind.MinusMinusToken,
    "<<": SyntaxKind.LessThanLessThanToken,
    "</": SyntaxKind.LessThanSlashToken,
    ">>": SyntaxKind.GreaterThanGreaterThanToken,
    ">>>": SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
    "&": SyntaxKind.AmpersandToken,
    "|": SyntaxKind.BarToken,
    "^": SyntaxKind.CaretToken,
    "!": SyntaxKind.ExclamationToken,
    "~": SyntaxKind.TildeToken,
    "&&": SyntaxKind.AmpersandAmpersandToken,
    "||": SyntaxKind.BarBarToken,
    "?": SyntaxKind.QuestionToken,
    ":": SyntaxKind.ColonToken,
    "=": SyntaxKind.EqualsToken,
    "+=": SyntaxKind.PlusEqualsToken,
    "-=": SyntaxKind.MinusEqualsToken,
    "*=": SyntaxKind.AsteriskEqualsToken,
    "/=": SyntaxKind.SlashEqualsToken,
    "%=": SyntaxKind.PercentEqualsToken,
    "<<=": SyntaxKind.LessThanLessThanEqualsToken,
    ">>=": SyntaxKind.GreaterThanGreaterThanEqualsToken,
    ">>>=": SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    "&=": SyntaxKind.AmpersandEqualsToken,
    "|=": SyntaxKind.BarEqualsToken,
    "^=": SyntaxKind.CaretEqualsToken,
    "@": SyntaxKind.AtToken,
});

/*
    As per ECMAScript Language Specification 5th Edition, Section 7.6: ISyntaxToken Names and Identifiers
    IdentifierStart ::
        Can contain Unicode 6.2  categories:
        Uppercase letter (Lu),
        Lowercase letter (Ll),
        Titlecase letter (Lt),
        Modifier letter (Lm),
        Other letter (Lo), or
        Letter number (Nl).
    IdentifierPart ::
        Can contain IdentifierStart + Unicode 6.2  categories:
        Non-spacing mark (Mn),
        Combining spacing mark (Mc),
        Decimal number (Nd),
        Connector punctuation (Pc),
        <ZWNJ>, or
        <ZWJ>.

    Codepoint ranges for ES5 Identifiers are extracted from the Unicode 6.2 specification at:
    http://www.unicode.org/Public/6.2.0/ucd/UnicodeData.txt
*/
const unicodeES5IdentifierStart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 880, 884, 886, 887, 890, 893, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1162, 1319, 1329, 1366, 1369, 1369, 1377, 1415, 1488, 1514, 1520, 1522, 1568, 1610, 1646, 1647, 1649, 1747, 1749, 1749, 1765, 1766, 1774, 1775, 1786, 1788, 1791, 1791, 1808, 1808, 1810, 1839, 1869, 1957, 1969, 1969, 1994, 2026, 2036, 2037, 2042, 2042, 2048, 2069, 2074, 2074, 2084, 2084, 2088, 2088, 2112, 2136, 2208, 2208, 2210, 2220, 2308, 2361, 2365, 2365, 2384, 2384, 2392, 2401, 2417, 2423, 2425, 2431, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2493, 2493, 2510, 2510, 2524, 2525, 2527, 2529, 2544, 2545, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2649, 2652, 2654, 2654, 2674, 2676, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2749, 2749, 2768, 2768, 2784, 2785, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2877, 2877, 2908, 2909, 2911, 2913, 2929, 2929, 2947, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3024, 3024, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3133, 3133, 3160, 3161, 3168, 3169, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3261, 3261, 3294, 3294, 3296, 3297, 3313, 3314, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3389, 3406, 3406, 3424, 3425, 3450, 3455, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3585, 3632, 3634, 3635, 3648, 3654, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3760, 3762, 3763, 3773, 3773, 3776, 3780, 3782, 3782, 3804, 3807, 3840, 3840, 3904, 3911, 3913, 3948, 3976, 3980, 4096, 4138, 4159, 4159, 4176, 4181, 4186, 4189, 4193, 4193, 4197, 4198, 4206, 4208, 4213, 4225, 4238, 4238, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5888, 5900, 5902, 5905, 5920, 5937, 5952, 5969, 5984, 5996, 5998, 6000, 6016, 6067, 6103, 6103, 6108, 6108, 6176, 6263, 6272, 6312, 6314, 6314, 6320, 6389, 6400, 6428, 6480, 6509, 6512, 6516, 6528, 6571, 6593, 6599, 6656, 6678, 6688, 6740, 6823, 6823, 6917, 6963, 6981, 6987, 7043, 7072, 7086, 7087, 7098, 7141, 7168, 7203, 7245, 7247, 7258, 7293, 7401, 7404, 7406, 7409, 7413, 7414, 7424, 7615, 7680, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8305, 8305, 8319, 8319, 8336, 8348, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11502, 11506, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11648, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11823, 11823, 12293, 12295, 12321, 12329, 12337, 12341, 12344, 12348, 12353, 12438, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42527, 42538, 42539, 42560, 42606, 42623, 42647, 42656, 42735, 42775, 42783, 42786, 42888, 42891, 42894, 42896, 42899, 42912, 42922, 43000, 43009, 43011, 43013, 43015, 43018, 43020, 43042, 43072, 43123, 43138, 43187, 43250, 43255, 43259, 43259, 43274, 43301, 43312, 43334, 43360, 43388, 43396, 43442, 43471, 43471, 43520, 43560, 43584, 43586, 43588, 43595, 43616, 43638, 43642, 43642, 43648, 43695, 43697, 43697, 43701, 43702, 43705, 43709, 43712, 43712, 43714, 43714, 43739, 43741, 43744, 43754, 43762, 43764, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43968, 44002, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64285, 64287, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65136, 65140, 65142, 65276, 65313, 65338, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500];
const unicodeES5IdentifierPart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 768, 884, 886, 887, 890, 893, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1155, 1159, 1162, 1319, 1329, 1366, 1369, 1369, 1377, 1415, 1425, 1469, 1471, 1471, 1473, 1474, 1476, 1477, 1479, 1479, 1488, 1514, 1520, 1522, 1552, 1562, 1568, 1641, 1646, 1747, 1749, 1756, 1759, 1768, 1770, 1788, 1791, 1791, 1808, 1866, 1869, 1969, 1984, 2037, 2042, 2042, 2048, 2093, 2112, 2139, 2208, 2208, 2210, 2220, 2276, 2302, 2304, 2403, 2406, 2415, 2417, 2423, 2425, 2431, 2433, 2435, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2492, 2500, 2503, 2504, 2507, 2510, 2519, 2519, 2524, 2525, 2527, 2531, 2534, 2545, 2561, 2563, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2620, 2620, 2622, 2626, 2631, 2632, 2635, 2637, 2641, 2641, 2649, 2652, 2654, 2654, 2662, 2677, 2689, 2691, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2748, 2757, 2759, 2761, 2763, 2765, 2768, 2768, 2784, 2787, 2790, 2799, 2817, 2819, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2876, 2884, 2887, 2888, 2891, 2893, 2902, 2903, 2908, 2909, 2911, 2915, 2918, 2927, 2929, 2929, 2946, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3006, 3010, 3014, 3016, 3018, 3021, 3024, 3024, 3031, 3031, 3046, 3055, 3073, 3075, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3133, 3140, 3142, 3144, 3146, 3149, 3157, 3158, 3160, 3161, 3168, 3171, 3174, 3183, 3202, 3203, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3260, 3268, 3270, 3272, 3274, 3277, 3285, 3286, 3294, 3294, 3296, 3299, 3302, 3311, 3313, 3314, 3330, 3331, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3396, 3398, 3400, 3402, 3406, 3415, 3415, 3424, 3427, 3430, 3439, 3450, 3455, 3458, 3459, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3530, 3530, 3535, 3540, 3542, 3542, 3544, 3551, 3570, 3571, 3585, 3642, 3648, 3662, 3664, 3673, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3769, 3771, 3773, 3776, 3780, 3782, 3782, 3784, 3789, 3792, 3801, 3804, 3807, 3840, 3840, 3864, 3865, 3872, 3881, 3893, 3893, 3895, 3895, 3897, 3897, 3902, 3911, 3913, 3948, 3953, 3972, 3974, 3991, 3993, 4028, 4038, 4038, 4096, 4169, 4176, 4253, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4957, 4959, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5888, 5900, 5902, 5908, 5920, 5940, 5952, 5971, 5984, 5996, 5998, 6000, 6002, 6003, 6016, 6099, 6103, 6103, 6108, 6109, 6112, 6121, 6155, 6157, 6160, 6169, 6176, 6263, 6272, 6314, 6320, 6389, 6400, 6428, 6432, 6443, 6448, 6459, 6470, 6509, 6512, 6516, 6528, 6571, 6576, 6601, 6608, 6617, 6656, 6683, 6688, 6750, 6752, 6780, 6783, 6793, 6800, 6809, 6823, 6823, 6912, 6987, 6992, 7001, 7019, 7027, 7040, 7155, 7168, 7223, 7232, 7241, 7245, 7293, 7376, 7378, 7380, 7414, 7424, 7654, 7676, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8204, 8205, 8255, 8256, 8276, 8276, 8305, 8305, 8319, 8319, 8336, 8348, 8400, 8412, 8417, 8417, 8421, 8432, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11647, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11744, 11775, 11823, 11823, 12293, 12295, 12321, 12335, 12337, 12341, 12344, 12348, 12353, 12438, 12441, 12442, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42539, 42560, 42607, 42612, 42621, 42623, 42647, 42655, 42737, 42775, 42783, 42786, 42888, 42891, 42894, 42896, 42899, 42912, 42922, 43000, 43047, 43072, 43123, 43136, 43204, 43216, 43225, 43232, 43255, 43259, 43259, 43264, 43309, 43312, 43347, 43360, 43388, 43392, 43456, 43471, 43481, 43520, 43574, 43584, 43597, 43600, 43609, 43616, 43638, 43642, 43643, 43648, 43714, 43739, 43741, 43744, 43759, 43762, 43766, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43968, 44010, 44012, 44013, 44016, 44025, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65024, 65039, 65056, 65062, 65075, 65076, 65101, 65103, 65136, 65140, 65142, 65276, 65296, 65305, 65313, 65338, 65343, 65343, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500];

function lookupInUnicodeMap(code: number, map: ReadonlyArray<number>): boolean {
    // Bail out quickly if it couldn't possibly be in the map.
    if (code < map[0]) {
        return false;
    }

    // Perform binary search in one of the Unicode range maps
    let lo = 0;
    let hi: number = map.length;
    let mid: number;

    while (lo + 1 < hi) {
        mid = lo + (hi - lo) / 2;
        // mid has to be even to catch a range's beginning
        mid -= mid % 2;
        if (map[mid] <= code && code <= map[mid + 1]) {
            return true;
        }

        if (code < map[mid]) {
            hi = mid;
        }
        else {
            lo = mid + 2;
        }
    }

    return false;
}

    /* @internal */ export function isUnicodeIdentifierStart(code: number) {
    return lookupInUnicodeMap(code, unicodeES5IdentifierStart);
}

function isUnicodeIdentifierPart(code: number) {
    return lookupInUnicodeMap(code, unicodeES5IdentifierPart);
}

function makeReverseMap(source: Map<number>): string[] {
    const result: string[] = [];
    source.forEach((value, name) => {
        result[value] = name;
    });
    return result;
}

const tokenStrings = makeReverseMap(textToToken);

export function tokenToString(t: SyntaxKind): string | undefined {
    return tokenStrings[t];
}

/* @internal */
export function stringToToken(s: string): SyntaxKind {
    return textToToken.get(s);
}

/* @internal */
export function computeLineStarts(text: string): number[] {
    const result: number[] = new Array();
    let pos = 0;
    let lineStart = 0;
    while (pos < text.length) {
        const ch = text.charCodeAt(pos);
        pos++;
        switch (ch) {
            case CharacterCodes.carriageReturn:
                if (text.charCodeAt(pos) === CharacterCodes.lineFeed) {
                    pos++;
                }
            // falls through
            case CharacterCodes.lineFeed:
                result.push(lineStart);
                lineStart = pos;
                break;
            default:
                if (ch > CharacterCodes.maxAsciiCharacter && isLineBreak(ch)) {
                    result.push(lineStart);
                    lineStart = pos;
                }
                break;
        }
    }
    result.push(lineStart);
    return result;
}

export function getPositionOfLineAndCharacter(sourceFile: SourceFile, line: number, character: number): number {
    return computePositionOfLineAndCharacter(getLineStarts(sourceFile), line, character, sourceFile.text);
}

/* @internal */
export function computePositionOfLineAndCharacter(lineStarts: ReadonlyArray<number>, line: number, character: number, debugText?: string): number {
    Debug.assert(line >= 0 && line < lineStarts.length);
    const res = lineStarts[line] + character;
    if (line < lineStarts.length - 1) {
        Debug.assert(res < lineStarts[line + 1]);
    }
    else if (debugText !== undefined) {
        Debug.assert(res <= debugText.length); // Allow single character overflow for trailing newline
    }
    return res;
}

/* @internal */
export function getLineStarts(sourceFile: SourceFileLike): ReadonlyArray<number> {
    return sourceFile.lineMap || (sourceFile.lineMap = computeLineStarts(sourceFile.text));
}

/* @internal */
/**
 * We assume the first line starts at position 0 and 'position' is non-negative.
 */
export function computeLineAndCharacterOfPosition(lineStarts: ReadonlyArray<number>, position: number) {
    let lineNumber = binarySearch(lineStarts, position);
    if (lineNumber < 0) {
        // If the actual position was not found,
        // the binary search returns the 2's-complement of the next line start
        // e.g. if the line starts at [5, 10, 23, 80] and the position requested was 20
        // then the search will return -2.
        //
        // We want the index of the previous line start, so we subtract 1.
        // Review 2's-complement if this is confusing.
        lineNumber = ~lineNumber - 1;
        Debug.assert(lineNumber !== -1, "position cannot precede the beginning of the file");
    }
    return {
        line: lineNumber,
        character: position - lineStarts[lineNumber]
    };
}

export function getLineAndCharacterOfPosition(sourceFile: SourceFileLike, position: number): LineAndCharacter {
    return computeLineAndCharacterOfPosition(getLineStarts(sourceFile), position);
}

/** Does not include line breaks. For that, see isWhiteSpaceLike. */
export function isWhiteSpaceSingleLine(ch: number): boolean {
    // Note: nextLine is in the Zs space, and should be considered to be a whitespace.
    // It is explicitly not a line-break as it isn't in the exact set specified by EcmaScript.
    return ch === CharacterCodes.space ||
        ch === CharacterCodes.tab ||
        ch === CharacterCodes.verticalTab ||
        ch === CharacterCodes.formFeed ||
        ch === CharacterCodes.nonBreakingSpace ||
        ch === CharacterCodes.nextLine ||
        ch === CharacterCodes.ogham ||
        ch >= CharacterCodes.enQuad && ch <= CharacterCodes.zeroWidthSpace ||
        ch === CharacterCodes.narrowNoBreakSpace ||
        ch === CharacterCodes.mathematicalSpace ||
        ch === CharacterCodes.ideographicSpace ||
        ch === CharacterCodes.byteOrderMark;
}

export function isLineBreak(ch: number): boolean {
    // ES5 7.3:
    // The ECMAScript line terminator characters are listed in Table 3.
    //     Table 3: Line Terminator Characters
    //     Code Unit Value     Name                    Formal Name
    //     \u000A              Line Feed               <LF>
    //     \u000D              Carriage Return         <CR>
    //     \u2028              Line separator          <LS>
    //     \u2029              Paragraph separator     <PS>
    // Only the characters in Table 3 are treated as line terminators. Other new line or line
    // breaking characters are treated as white space but not as line terminators.

    return ch === CharacterCodes.lineFeed ||
        ch === CharacterCodes.carriageReturn ||
        ch === CharacterCodes.lineSeparator ||
        ch === CharacterCodes.paragraphSeparator;
}

function isDigit(ch: number): boolean {
    return ch >= CharacterCodes._0 && ch <= CharacterCodes._9;
}

/* @internal */
export function isOctalDigit(ch: number): boolean {
    return ch >= CharacterCodes._0 && ch <= CharacterCodes._7;
}

// All conflict markers consist of the same character repeated seven times.  If it is
// a <<<<<<< or >>>>>>> marker then it is also followed by a space.
const mergeConflictMarkerLength = "<<<<<<<".length;

function isConflictMarkerTrivia(text: string, pos: number) {
    Debug.assert(pos >= 0);

    // Conflict markers must be at the start of a line.
    if (pos === 0 || isLineBreak(text.charCodeAt(pos - 1))) {
        const ch = text.charCodeAt(pos);

        if ((pos + mergeConflictMarkerLength) < text.length) {
            for (let i = 0; i < mergeConflictMarkerLength; i++) {
                if (text.charCodeAt(pos + i) !== ch) {
                    return false;
                }
            }

            return ch === CharacterCodes.equals ||
                text.charCodeAt(pos + mergeConflictMarkerLength) === CharacterCodes.space;
        }
    }

    return false;
}

function scanConflictMarkerTrivia(text: string, pos: number, error?: ErrorCallback) {
    if (error) {
        error("Merge conflict marker encountered", mergeConflictMarkerLength);
    }

    const ch = text.charCodeAt(pos);
    const len = text.length;

    if (ch === CharacterCodes.lessThan || ch === CharacterCodes.greaterThan) {
        while (pos < len && !isLineBreak(text.charCodeAt(pos))) {
            pos++;
        }
    }
    else {
        Debug.assert(ch === CharacterCodes.bar || ch === CharacterCodes.equals);
        // Consume everything from the start of a ||||||| or ======= marker to the start
        // of the next ======= or >>>>>>> marker.
        while (pos < len) {
            const currentChar = text.charCodeAt(pos);
            if ((currentChar === CharacterCodes.equals || currentChar === CharacterCodes.greaterThan) && currentChar !== ch && isConflictMarkerTrivia(text, pos)) {
                break;
            }

            pos++;
        }
    }

    return pos;
}

export function isIdentifierStart(ch: number): boolean {
    return ch >= CharacterCodes.A && ch <= CharacterCodes.Z || ch >= CharacterCodes.a && ch <= CharacterCodes.z ||
        ch === CharacterCodes.$ || ch === CharacterCodes._ ||
        ch > CharacterCodes.maxAsciiCharacter && isUnicodeIdentifierStart(ch);
}

export function isIdentifierPart(ch: number): boolean {
    return ch >= CharacterCodes.A && ch <= CharacterCodes.Z || ch >= CharacterCodes.a && ch <= CharacterCodes.z ||
        ch >= CharacterCodes._0 && ch <= CharacterCodes._9 || ch === CharacterCodes.$ || ch === CharacterCodes._ ||
        ch > CharacterCodes.maxAsciiCharacter && isUnicodeIdentifierPart(ch);
}

/* @internal */
export function isIdentifierText(name: string): boolean {
    if (!isIdentifierStart(name.charCodeAt(0))) {
        return false;
    }

    for (let i = 1; i < name.length; i++) {
        if (!isIdentifierPart(name.charCodeAt(i))) {
            return false;
        }
    }

    return true;
}

// Creates a scanner over a (possibly unspecified) range of a piece of text.
export function createScanner(skipTrivia: boolean,
    text?: string,
    onError?: ErrorCallback,
    start?: number,
    length?: number): Scanner {
    // Current position (end position of text of current token)
    let pos: number;

    // end of text
    let end: number;

    // Start position of whitespace before current token
    let startPos: number;

    // Start position of text of current token
    let tokenPos: number;

    let token: SyntaxKind;
    let tokenValue: string;
    let precedingLineBreak: boolean;
    let hasExtendedUnicodeEscape: boolean;
    let tokenIsUnterminated: boolean;
    let numericLiteralFlags: NumericLiteralFlags;

    setText(text, start, length);

    return {
        getStartPos: () => startPos,
        getTextPos: () => pos,
        getToken: () => token,
        getTokenPos: () => tokenPos,
        getTokenText: () => text.substring(tokenPos, pos),
        getTokenValue: () => tokenValue,
        hasExtendedUnicodeEscape: () => hasExtendedUnicodeEscape,
        hasPrecedingLineBreak: () => precedingLineBreak,
        isIdentifier: () => token === SyntaxKind.Identifier || token > SyntaxKind.LastReservedWord,
        isReservedWord: () => token >= SyntaxKind.FirstReservedWord && token <= SyntaxKind.LastReservedWord,
        isUnterminated: () => tokenIsUnterminated,
        getNumericLiteralFlags: () => numericLiteralFlags,
        reScanGreaterToken,
        scan,
        getText,
        setText,
        setOnError,
        setTextPos,
    };

    function error(message: string, length?: number): void {
        if (onError) {
            onError(message, length || 0);
        }
    }

    function scanNumber(): string {
        const start = pos;
        while (isDigit(text.charCodeAt(pos))) pos++;
        if (text.charCodeAt(pos) === CharacterCodes.dot) {
            pos++;
            while (isDigit(text.charCodeAt(pos))) pos++;
        }
        let end = pos;
        if (text.charCodeAt(pos) === CharacterCodes.E || text.charCodeAt(pos) === CharacterCodes.e) {
            pos++;
            numericLiteralFlags = NumericLiteralFlags.Scientific;
            if (text.charCodeAt(pos) === CharacterCodes.plus || text.charCodeAt(pos) === CharacterCodes.minus) pos++;
            if (isDigit(text.charCodeAt(pos))) {
                pos++;
                while (isDigit(text.charCodeAt(pos))) pos++;
                end = pos;
            }
            else {
                error("Digit expected");
            }
        }
        return "" + +(text.substring(start, end));
    }

    function scanOctalDigits(): number {
        const start = pos;
        while (isOctalDigit(text.charCodeAt(pos))) {
            pos++;
        }
        return +(text.substring(start, pos));
    }

    /**
     * Scans the given number of hexadecimal digits in the text,
     * returning -1 if the given number is unavailable.
     */
    function scanExactNumberOfHexDigits(count: number): number {
        return scanHexDigits(/*minCount*/ count, /*scanAsManyAsPossible*/ false);
    }

    /**
     * Scans as many hexadecimal digits as are available in the text,
     * returning -1 if the given number of digits was unavailable.
     */
    function scanMinimumNumberOfHexDigits(count: number): number {
        return scanHexDigits(/*minCount*/ count, /*scanAsManyAsPossible*/ true);
    }

    function scanHexDigits(minCount: number, scanAsManyAsPossible: boolean): number {
        let digits = 0;
        let value = 0;
        while (digits < minCount || scanAsManyAsPossible) {
            const ch = text.charCodeAt(pos);
            if (ch >= CharacterCodes._0 && ch <= CharacterCodes._9) {
                value = value * 16 + ch - CharacterCodes._0;
            }
            else if (ch >= CharacterCodes.A && ch <= CharacterCodes.F) {
                value = value * 16 + ch - CharacterCodes.A + 10;
            }
            else if (ch >= CharacterCodes.a && ch <= CharacterCodes.f) {
                value = value * 16 + ch - CharacterCodes.a + 10;
            }
            else {
                break;
            }
            pos++;
            digits++;
        }
        if (digits < minCount) {
            value = -1;
        }
        return value;
    }

    function scanString(allowEscapes = true): string {
        const quote = text.charCodeAt(pos);
        pos++;
        let result = "";
        let start = pos;
        while (true) {
            if (pos >= end) {
                result += text.substring(start, pos);
                tokenIsUnterminated = true;
                error("Unterminated string literal");
                break;
            }
            const ch = text.charCodeAt(pos);
            if (ch === quote) {
                result += text.substring(start, pos);
                pos++;
                break;
            }
            if (ch === CharacterCodes.backslash && allowEscapes) {
                result += text.substring(start, pos);
                result += scanEscapeSequence();
                start = pos;
                continue;
            }
            if (isLineBreak(ch)) {
                result += text.substring(start, pos);
                tokenIsUnterminated = true;
                error("Unterminated string literal");
                break;
            }
            pos++;
        }
        return result;
    }

    function scanEscapeSequence(): string {
        pos++;
        if (pos >= end) {
            error("Unexpected end of text");
            return "";
        }
        const ch = text.charCodeAt(pos);
        pos++;
        switch (ch) {
            case CharacterCodes._0:
                return "\0";
            case CharacterCodes.b:
                return "\b";
            case CharacterCodes.t:
                return "\t";
            case CharacterCodes.n:
                return "\n";
            case CharacterCodes.v:
                return "\v";
            case CharacterCodes.f:
                return "\f";
            case CharacterCodes.r:
                return "\r";
            case CharacterCodes.singleQuote:
                return "\'";
            case CharacterCodes.doubleQuote:
                return "\"";
            case CharacterCodes.u:
                // '\u{DDDDDDDD}'
                if (pos < end && text.charCodeAt(pos) === CharacterCodes.openBrace) {
                    hasExtendedUnicodeEscape = true;
                    pos++;
                    return scanExtendedUnicodeEscape();
                }

                // '\uDDDD'
                return scanHexadecimalEscape(/*numDigits*/ 4);

            case CharacterCodes.x:
                // '\xDD'
                return scanHexadecimalEscape(/*numDigits*/ 2);

            // when encountering a LineContinuation (i.e. a backslash and a line terminator sequence),
            // the line terminator is interpreted to be "the empty code unit sequence".
            case CharacterCodes.carriageReturn:
                if (pos < end && text.charCodeAt(pos) === CharacterCodes.lineFeed) {
                    pos++;
                }
            // falls through
            case CharacterCodes.lineFeed:
            case CharacterCodes.lineSeparator:
            case CharacterCodes.paragraphSeparator:
                return "";
            default:
                return String.fromCharCode(ch);
        }
    }

    function scanHexadecimalEscape(numDigits: number): string {
        const escapedValue = scanExactNumberOfHexDigits(numDigits);

        if (escapedValue >= 0) {
            return String.fromCharCode(escapedValue);
        }
        else {
            error("Hexadecimal digit expected");
            return "";
        }
    }

    function scanExtendedUnicodeEscape(): string {
        const escapedValue = scanMinimumNumberOfHexDigits(1);
        let isInvalidExtendedEscape = false;

        // Validate the value of the digit
        if (escapedValue < 0) {
            error("Hexadecimal digit expected");
            isInvalidExtendedEscape = true;
        }
        else if (escapedValue > 0x10FFFF) {
            error("An extended Unicode escape value must be between 0x0 and 0x10FFFF inclusive");
            isInvalidExtendedEscape = true;
        }

        if (pos >= end) {
            error("Unexpected end of text");
            isInvalidExtendedEscape = true;
        }
        else if (text.charCodeAt(pos) === CharacterCodes.closeBrace) {
            // Only swallow the following character up if it's a '}'.
            pos++;
        }
        else {
            error("Unterminated Unicode escape sequence");
            isInvalidExtendedEscape = true;
        }

        if (isInvalidExtendedEscape) {
            return "";
        }

        return utf16EncodeAsString(escapedValue);
    }

    // Derived from the 10.1.1 UTF16Encoding of the ES6 Spec.
    function utf16EncodeAsString(codePoint: number): string {
        Debug.assert(0x0 <= codePoint && codePoint <= 0x10FFFF);

        if (codePoint <= 65535) {
            return String.fromCharCode(codePoint);
        }

        const codeUnit1 = Math.floor((codePoint - 65536) / 1024) + 0xD800;
        const codeUnit2 = ((codePoint - 65536) % 1024) + 0xDC00;

        return String.fromCharCode(codeUnit1, codeUnit2);
    }

    // Current character is known to be a backslash. Check for Unicode escape of the form '\uXXXX'
    // and return code point value if valid Unicode escape is found. Otherwise return -1.
    function peekUnicodeEscape(): number {
        if (pos + 5 < end && text.charCodeAt(pos + 1) === CharacterCodes.u) {
            const start = pos;
            pos += 2;
            const value = scanExactNumberOfHexDigits(4);
            pos = start;
            return value;
        }
        return -1;
    }

    function scanIdentifierParts(): string {
        let result = "";
        let start = pos;
        while (pos < end) {
            let ch = text.charCodeAt(pos);
            if (isIdentifierPart(ch)) {
                pos++;
            }
            else if (ch === CharacterCodes.backslash) {
                ch = peekUnicodeEscape();
                if (!(ch >= 0 && isIdentifierPart(ch))) {
                    break;
                }
                result += text.substring(start, pos);
                result += String.fromCharCode(ch);
                // Valid Unicode escape is always six characters
                pos += 6;
                start = pos;
            }
            else {
                break;
            }
        }
        result += text.substring(start, pos);
        return result;
    }

    function getIdentifierToken(): SyntaxKind {
        // Reserved words are between 2 and 11 characters long and start with a lowercase letter
        const len = tokenValue.length;
        if (len >= 2 && len <= 11) {
            const ch = tokenValue.charCodeAt(0);
            if (ch >= CharacterCodes.a && ch <= CharacterCodes.z) {
                token = textToToken.get(tokenValue);
                if (token !== undefined) {
                    return token;
                }
            }
        }
        return token = SyntaxKind.Identifier;
    }

    function scan(): SyntaxKind {
        startPos = pos;
        hasExtendedUnicodeEscape = false;
        precedingLineBreak = false;
        tokenIsUnterminated = false;
        numericLiteralFlags = 0;
        while (true) {
            tokenPos = pos;
            if (pos >= end) {
                return token = SyntaxKind.EndOfFileToken;
            }
            let ch = text.charCodeAt(pos);
            switch (ch) {
                case CharacterCodes.lineFeed:
                case CharacterCodes.carriageReturn:
                    precedingLineBreak = true;
                    if (skipTrivia) {
                        pos++;
                        continue;
                    }
                    else {
                        if (ch === CharacterCodes.carriageReturn && pos + 1 < end && text.charCodeAt(pos + 1) === CharacterCodes.lineFeed) {
                            // consume both CR and LF
                            pos += 2;
                        }
                        else {
                            pos++;
                        }
                        return token = SyntaxKind.NewLineTrivia;
                    }
                case CharacterCodes.tab:
                case CharacterCodes.verticalTab:
                case CharacterCodes.formFeed:
                case CharacterCodes.space:
                    if (skipTrivia) {
                        pos++;
                        continue;
                    }
                    else {
                        while (pos < end && isWhiteSpaceSingleLine(text.charCodeAt(pos))) {
                            pos++;
                        }
                        return token = SyntaxKind.WhitespaceTrivia;
                    }
                case CharacterCodes.exclamation:
                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.ExclamationEqualsToken;
                    }
                    pos++;
                    return token = SyntaxKind.ExclamationToken;
                case CharacterCodes.doubleQuote:
                case CharacterCodes.singleQuote:
                    tokenValue = scanString();
                    return token = SyntaxKind.StringLiteral;
                case CharacterCodes.percent:
                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.PercentEqualsToken;
                    }
                    pos++;
                    return token = SyntaxKind.PercentToken;
                case CharacterCodes.ampersand:
                    if (text.charCodeAt(pos + 1) === CharacterCodes.ampersand) {
                        return pos += 2, token = SyntaxKind.AmpersandAmpersandToken;
                    }
                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.AmpersandEqualsToken;
                    }
                    pos++;
                    return token = SyntaxKind.AmpersandToken;
                case CharacterCodes.openParen:
                    pos++;
                    return token = SyntaxKind.OpenParenToken;
                case CharacterCodes.closeParen:
                    pos++;
                    return token = SyntaxKind.CloseParenToken;
                case CharacterCodes.asterisk:
                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.AsteriskEqualsToken;
                    }
                    if (text.charCodeAt(pos + 1) === CharacterCodes.asterisk) {
                        return pos += 2, token = SyntaxKind.AsteriskAsteriskToken;
                    }
                    pos++;
                    return token = SyntaxKind.AsteriskToken;
                case CharacterCodes.plus:
                    if (text.charCodeAt(pos + 1) === CharacterCodes.plus) {
                        return pos += 2, token = SyntaxKind.PlusPlusToken;
                    }
                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.PlusEqualsToken;
                    }
                    pos++;
                    return token = SyntaxKind.PlusToken;
                case CharacterCodes.comma:
                    pos++;
                    return token = SyntaxKind.CommaToken;
                case CharacterCodes.minus:
                    if (text.charCodeAt(pos + 1) === CharacterCodes.minus) {
                        return pos += 2, token = SyntaxKind.MinusMinusToken;
                    }
                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.MinusEqualsToken;
                    }
                    pos++;
                    return token = SyntaxKind.MinusToken;
                case CharacterCodes.dot:
                    if (isDigit(text.charCodeAt(pos + 1))) {
                        tokenValue = scanNumber();
                        return token = SyntaxKind.NumericLiteral;
                    }
                    if (text.charCodeAt(pos + 1) === CharacterCodes.dot && text.charCodeAt(pos + 2) === CharacterCodes.dot) {
                        return pos += 3, token = SyntaxKind.DotDotDotToken;
                    }
                    pos++;
                    return token = SyntaxKind.DotToken;
                case CharacterCodes.slash:
                    // Single-line comment
                    if (text.charCodeAt(pos + 1) === CharacterCodes.slash) {
                        pos += 2;

                        while (pos < end) {
                            if (isLineBreak(text.charCodeAt(pos))) {
                                break;
                            }
                            pos++;

                        }

                        if (skipTrivia) {
                            continue;
                        }
                        else {
                            return token = SyntaxKind.SingleLineCommentTrivia;
                        }
                    }
                    // Multi-line comment
                    if (text.charCodeAt(pos + 1) === CharacterCodes.asterisk) {
                        pos += 2;

                        let commentClosed = false;
                        while (pos < end) {
                            const ch = text.charCodeAt(pos);

                            if (ch === CharacterCodes.asterisk && text.charCodeAt(pos + 1) === CharacterCodes.slash) {
                                pos += 2;
                                commentClosed = true;
                                break;
                            }

                            if (isLineBreak(ch)) {
                                precedingLineBreak = true;
                            }
                            pos++;
                        }

                        if (!commentClosed) {
                            error("Asterisk Slash expected");
                        }

                        if (skipTrivia) {
                            continue;
                        }
                        else {
                            tokenIsUnterminated = !commentClosed;
                            return token = SyntaxKind.MultiLineCommentTrivia;
                        }
                    }

                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.SlashEqualsToken;
                    }

                    pos++;
                    return token = SyntaxKind.SlashToken;

                case CharacterCodes._0:
                    if (pos + 2 < end && (text.charCodeAt(pos + 1) === CharacterCodes.X || text.charCodeAt(pos + 1) === CharacterCodes.x)) {
                        pos += 2;
                        let value = scanMinimumNumberOfHexDigits(1);
                        if (value < 0) {
                            error("Hexadecimal digit expected");
                            value = 0;
                        }
                        tokenValue = "" + value;
                        numericLiteralFlags = NumericLiteralFlags.HexSpecifier;
                        return token = SyntaxKind.NumericLiteral;
                    }
                    // Try to parse as an octal
                    if (pos + 1 < end && isOctalDigit(text.charCodeAt(pos + 1))) {
                        tokenValue = "" + scanOctalDigits();
                        numericLiteralFlags = NumericLiteralFlags.Octal;
                        return token = SyntaxKind.NumericLiteral;
                    }
                // This fall-through is a deviation from the EcmaScript grammar. The grammar says that a leading zero
                // can only be followed by an octal digit, a dot, or the end of the number literal. However, we are being
                // permissive and allowing decimal digits of the form 08* and 09* (which many browsers also do).
                // falls through
                case CharacterCodes._1:
                case CharacterCodes._2:
                case CharacterCodes._3:
                case CharacterCodes._4:
                case CharacterCodes._5:
                case CharacterCodes._6:
                case CharacterCodes._7:
                case CharacterCodes._8:
                case CharacterCodes._9:
                    tokenValue = scanNumber();
                    return token = SyntaxKind.NumericLiteral;
                case CharacterCodes.colon:
                    pos++;
                    return token = SyntaxKind.ColonToken;
                case CharacterCodes.semicolon:
                    pos++;
                    return token = SyntaxKind.SemicolonToken;
                case CharacterCodes.lessThan:
                    if (isConflictMarkerTrivia(text, pos)) {
                        pos = scanConflictMarkerTrivia(text, pos, error);
                        if (skipTrivia) {
                            continue;
                        }
                        else {
                            return token = SyntaxKind.ConflictMarkerTrivia;
                        }
                    }

                    if (text.charCodeAt(pos + 1) === CharacterCodes.lessThan) {
                        if (text.charCodeAt(pos + 2) === CharacterCodes.equals) {
                            return pos += 3, token = SyntaxKind.LessThanLessThanEqualsToken;
                        }
                        return pos += 2, token = SyntaxKind.LessThanLessThanToken;
                    }
                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.LessThanEqualsToken;
                    }
                    pos++;
                    return token = SyntaxKind.LessThanToken;
                case CharacterCodes.equals:
                    if (isConflictMarkerTrivia(text, pos)) {
                        pos = scanConflictMarkerTrivia(text, pos, error);
                        if (skipTrivia) {
                            continue;
                        }
                        else {
                            return token = SyntaxKind.ConflictMarkerTrivia;
                        }
                    }

                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.EqualsEqualsToken;
                    }
                    if (text.charCodeAt(pos + 1) === CharacterCodes.greaterThan) {
                        return pos += 2, token = SyntaxKind.EqualsGreaterThanToken;
                    }
                    pos++;
                    return token = SyntaxKind.EqualsToken;
                case CharacterCodes.greaterThan:
                    if (isConflictMarkerTrivia(text, pos)) {
                        pos = scanConflictMarkerTrivia(text, pos, error);
                        if (skipTrivia) {
                            continue;
                        }
                        else {
                            return token = SyntaxKind.ConflictMarkerTrivia;
                        }
                    }

                    pos++;
                    return token = SyntaxKind.GreaterThanToken;
                case CharacterCodes.question:
                    pos++;
                    return token = SyntaxKind.QuestionToken;
                case CharacterCodes.openBracket:
                    pos++;
                    return token = SyntaxKind.OpenBracketToken;
                case CharacterCodes.closeBracket:
                    pos++;
                    return token = SyntaxKind.CloseBracketToken;
                case CharacterCodes.caret:
                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.CaretEqualsToken;
                    }
                    pos++;
                    return token = SyntaxKind.CaretToken;
                case CharacterCodes.openBrace:
                    pos++;
                    return token = SyntaxKind.OpenBraceToken;
                case CharacterCodes.bar:
                    if (isConflictMarkerTrivia(text, pos)) {
                        pos = scanConflictMarkerTrivia(text, pos, error);
                        if (skipTrivia) {
                            continue;
                        }
                        else {
                            return token = SyntaxKind.ConflictMarkerTrivia;
                        }
                    }

                    if (text.charCodeAt(pos + 1) === CharacterCodes.bar) {
                        return pos += 2, token = SyntaxKind.BarBarToken;
                    }
                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.BarEqualsToken;
                    }
                    pos++;
                    return token = SyntaxKind.BarToken;
                case CharacterCodes.closeBrace:
                    pos++;
                    return token = SyntaxKind.CloseBraceToken;
                case CharacterCodes.tilde:
                    pos++;
                    return token = SyntaxKind.TildeToken;
                case CharacterCodes.at:
                    pos++;
                    return token = SyntaxKind.AtToken;
                case CharacterCodes.backslash:
                    const cookedChar = peekUnicodeEscape();
                    if (cookedChar >= 0 && isIdentifierStart(cookedChar)) {
                        pos += 6;
                        tokenValue = String.fromCharCode(cookedChar) + scanIdentifierParts();
                        return token = getIdentifierToken();
                    }
                    error("Invalid character");
                    pos++;
                    return token = SyntaxKind.Unknown;
                default:
                    if (isIdentifierStart(ch)) {
                        pos++;
                        while (pos < end && isIdentifierPart(ch = text.charCodeAt(pos))) pos++;
                        tokenValue = text.substring(tokenPos, pos);
                        if (ch === CharacterCodes.backslash) {
                            tokenValue += scanIdentifierParts();
                        }
                        return token = getIdentifierToken();
                    }
                    else if (isWhiteSpaceSingleLine(ch)) {
                        pos++;
                        continue;
                    }
                    else if (isLineBreak(ch)) {
                        precedingLineBreak = true;
                        pos++;
                        continue;
                    }
                    error("Invalid character");
                    pos++;
                    return token = SyntaxKind.Unknown;
            }
        }
    }

    function reScanGreaterToken(): SyntaxKind {
        if (token === SyntaxKind.GreaterThanToken) {
            if (text.charCodeAt(pos) === CharacterCodes.greaterThan) {
                if (text.charCodeAt(pos + 1) === CharacterCodes.greaterThan) {
                    if (text.charCodeAt(pos + 2) === CharacterCodes.equals) {
                        return pos += 3, token = SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken;
                    }
                    return pos += 2, token = SyntaxKind.GreaterThanGreaterThanGreaterThanToken;
                }
                if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                    return pos += 2, token = SyntaxKind.GreaterThanGreaterThanEqualsToken;
                }
                pos++;
                return token = SyntaxKind.GreaterThanGreaterThanToken;
            }
            if (text.charCodeAt(pos) === CharacterCodes.equals) {
                pos++;
                return token = SyntaxKind.GreaterThanEqualsToken;
            }
        }
        return token;
    }

    function getText(): string {
        return text;
    }

    function setText(newText: string, start: number, length: number) {
        text = newText || "";
        end = length === undefined ? text.length : start + length;
        setTextPos(start || 0);
    }

    function setOnError(errorCallback: ErrorCallback) {
        onError = errorCallback;
    }

    function setTextPos(textPos: number) {
        Debug.assert(textPos >= 0);
        pos = textPos;
        startPos = textPos;
        tokenPos = textPos;
        token = SyntaxKind.Unknown;
        precedingLineBreak = false;

        tokenValue = undefined;
        hasExtendedUnicodeEscape = false;
        tokenIsUnterminated = false;
    }
}

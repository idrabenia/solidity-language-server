Solidity Language Server
========================

[![](https://vsmarketplacebadge.apphb.com/version/kodebox.solidity-language-server.svg)](https://marketplace.visualstudio.com/items?itemName=kodebox.solidity-language-server)

**Warning: This project is in the alpha stage of development. Use at your own risk.**

This project aims to be the universal interface to a growing number of Solidity tools, providing a full-featured and easy to query backend for editors and IDEs that require Solidity specific functionality.

solidity-language-server is a language server for Solidity that adheres to the [Language Server Protocol (LSP)][lsp].

# Demo
![Screenshot](screenshots/autocomplete-demo.gif)

# Features
- [x] It uses LSP, so it should be easy to integrate with a wide selection of editors and IDEs
- [x] Diagnostics via [solc][solc], [Solium][solium] and [Solhint][solhint] warnings/errors
- [x] Auto completion

- [ ] Code actions and quick fixes
- [ ] Type information and documentation on hover
- [ ] Jump to definition
- [ ] List all top level definitions
- [ ] Highlight references in document
- [ ] Formatting
- [ ] Renaming

# Running

Though the solidity-language-server is built to work with many IDEs and editors, we currently use VSCode to test the solidity-language-server.

To run with VSCode, you'll need a [recent VSCode version][vscode] installed.

Next, you'll need to run the VSCode extension (for this step, you'll need a recent node installed):

```
git clone https://github.com/codechain-io/solidity-language-server.git
cd solidity-language-server
npm install
code .
```

VSCode will open into the solidity-language-server project. From here, click the Debug button on the left-hand side (a bug with a line through it). Next, click the green triangle at the top. This will launch a new instance of VSCode with the solidity-language-server plugin enabled.

# Contributing
Always feel free to help out! Whether it's filing bugs and feature requests or working on some of the open issues, we welcome your contributions.

In general, all contributions will be done using [GitHub’s pull request model][pr]. That is, you’ll fork our project, perform the work in a topic branch and then submit a pull request against our master branch.

[lsp]: https://github.com/Microsoft/language-server-protocol
[solium]: https://github.com/duaraghav8/Solium
[solhint]: https://github.com/protofire/solhint
[solc]: https://github.com/ethereum/solc-js
[vscode]: https://code.visualstudio.com/download
[pr]: https://help.github.com/articles/about-pull-requests/

# License

This project is made available under the Apache-2 License.

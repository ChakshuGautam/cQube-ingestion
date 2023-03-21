// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "cqube-spec-checker" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('cqube-spec-checker.checkSpec', async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from cqube-spec-checker!');
		// Get Current Workspace Folder
		const workspaceFolder = vscode.workspace.workspaceFolders[0];
		const ingestFolder = workspaceFolder.uri.fsPath + '/impl/c-qube/ingest';

		// Get all path for the Dimensions Folder and programs folder inside Ingest
		const dimensionFolder = ingestFolder + '/dimensions';
		const programs = ingestFolder + '/programs';

		// Get all the files inside the dimensions folder
		const dimensionFiles = (await vscode.workspace.fs.readDirectory(vscode.Uri.file(dimensionFolder))).map(file => file[0]);

		const regexDimensionGrammar = /\-dimension\.grammar.csv$/i;
		const regexDimensionData = /\-dimension\.data.csv$/i;

		// Check if all files in the dimensions folder are either dimension grammar or dimension data
		const dimensionFilesAreValid = dimensionFiles.every(file => regexDimensionGrammar.test(file) || regexDimensionData.test(file));

		// Highlight the ones that are not valid
		if (!dimensionFilesAreValid) {
			const dimensionFilesNotValid = dimensionFiles.filter(file => !regexDimensionGrammar.test(file) && !regexDimensionData.test(file));
			console.log(dimensionFilesNotValid);
			dimensionFilesNotValid.forEach(file => {
				vscode.window.showErrorMessage(`Invalid Dimension File: ${file}`);
				// Highlight the file using a squiggly line
				vscode.languages.createDiagnosticCollection('cqube-spec-checker').set(
					vscode.Uri.file(dimensionFolder + '/' + file),
					[new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), 'Invalid Dimension File Name: It should be "/\-dimension\.grammar.csv$/i" OR " /\-dimension\.data.csv$/i"',
						vscode.DiagnosticSeverity.Error)]);
			});
		}
		console.log("Done")
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}

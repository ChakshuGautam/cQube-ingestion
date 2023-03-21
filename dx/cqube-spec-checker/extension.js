// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { DimensionValidator, ValidationError } = require('./dimension.grammar.validator');


async function getFiles(folderUri) {
	const files = [];
	const directoryEntries = await vscode.workspace.fs.readDirectory(folderUri);
	for (const [entryName, entryType] of directoryEntries) {
		const entryUri = vscode.Uri.joinPath(folderUri, entryName);

		if (entryType === vscode.FileType.File) {
			files.push(entryUri);
		} else if (entryType === vscode.FileType.Directory) {
			const nestedFiles = await getFiles(entryUri);
			files.push(...nestedFiles);
		}
	}

	return files;
}


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

		// Get Current Workspace Folder
		const workspaceFolder = vscode.workspace.workspaceFolders[0];
		const ingestFolder = workspaceFolder.uri.fsPath + '/impl/c-qube/ingest';

		// Get all path for the Dimensions Folder and programs folder inside Ingest
		const dimensionFolder = ingestFolder + '/dimensions';
		const programsFolder = ingestFolder + '/programs';

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
					[new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), 'Invalid Dimension File Name: It should be "/\-dimension\.grammar.csv$/i" OR "/\-dimension\.data.csv$/i"',
						vscode.DiagnosticSeverity.Error)]);
			});
		}

		dimensionFiles.filter(file => regexDimensionGrammar.test(file)).forEach(async filePath => {
			// get file from file path
			const file = vscode.Uri.file(dimensionFolder + '/' + filePath);
			// get file content as string
			const fileContent = await vscode.workspace.fs.readFile(file);
			const fileContentString = fileContent.toString();

			// Validate using DimensionValidator
			const dimensionValidator = new DimensionValidator(fileContentString);
			const validationErrors = dimensionValidator.verify();

			// Highlight the errors
			if (validationErrors.length > 0) {
				validationErrors.forEach(error => {
					console.log({ error });
					vscode.window.showErrorMessage(`Dimension Grammar Error: ${error.message}`);
					// Highlight the file using a squiggly line
					vscode.languages.createDiagnosticCollection('cqube-spec-checker').set(
						file,
						[new vscode.Diagnostic(new vscode.Range(error.lineNumber - 1, 0, error.lineNumber - 1, 0), error,
							vscode.DiagnosticSeverity.Error)]);
				});
			}
		});

		// get all the files inside the programs folder. Get nested files as well. Ignore folders.
		const programFiles = (await getFiles(vscode.Uri.file(programsFolder))).map(file => file.path.split('programs/')[1]);
		const regexEventGrammar = /\-event\.grammar.csv$/i;
		const regexEventData = /\-event\.data.csv$/i;

		// Check if all files in the dimensions folder are either dimension grammar or dimension data
		const eventFilesAreValid = programFiles.every(file => regexEventGrammar.test(file.split('/')[1]) || regexEventData.test(file.split('/')[1]));

		console.log(eventFilesAreValid)

		// Highlight the ones that are not valid
		if (!eventFilesAreValid) {
			const eventFilesNotValid = programFiles.filter(file => !regexEventGrammar.test(file.split('/')[1]) && !regexEventData.test(file.split('/')[1]));
			console.log(eventFilesNotValid);
			eventFilesNotValid.forEach(file => {
				vscode.window.showErrorMessage(`Invalid Events File: ${file}`);
				// Highlight the file using a squiggly line
				vscode.languages.createDiagnosticCollection('cqube-spec-checker').set(
					vscode.Uri.file(programsFolder + '/' + file),
					[new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), 'Invalid Events File Name: It should be "/\-event\.grammar.csv$/i" OR "/\-event\.data.csv$/i"',
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

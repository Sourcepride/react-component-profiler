// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ComponentTreeBuilder } from './componentFinder';
import { ReactComponentProfiler } from './componentProfiler';
import { customDecorationProvider } from './customColorProvider';

/*
	
*/


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "react-component-profiler" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('react-component-profiler.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from React component profiler!');
	});
	vscode.window.registerFileDecorationProvider(new customDecorationProvider());

	const treeBuilder =new ComponentTreeBuilder();
	const provView = vscode.window.createTreeView('project-component-tree', {
		treeDataProvider: new ReactComponentProfiler(rootPath as string, treeBuilder )
	});

	provView.onDidChangeSelection((e)=>{
		e.selection.forEach((node)=>{
			if(node.type === "placeholder" && node.label.startsWith("from:")){
				const nodeFilePath =   node.label.split("from:")[1];
				vscode.workspace.openTextDocument(nodeFilePath.trim()).then((document)=>vscode.window.showTextDocument(document));
			}
		});

	});


	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

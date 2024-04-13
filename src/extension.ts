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
	const treeDataProvider = new ReactComponentProfiler(rootPath as string, treeBuilder, context);
	const provView = vscode.window.createTreeView('project-component-tree', {
		treeDataProvider: treeDataProvider
	});



	vscode.commands.registerCommand('project-component-tree.refreshEntry', ()=>{
		treeDataProvider.refresh();
	});
	vscode.commands.registerCommand('project-component-tree.onlyComponentFile', function (){
		context.workspaceState.update("showFileOnly",  true);
		context.workspaceState.update("showComponentOnly",  false);
		setButtonsAndContext();
		treeDataProvider.refresh();
	});
	vscode.commands.registerCommand('project-component-tree.onlyComponent', function (){
		context.workspaceState.update("showComponentOnly",  true);
		context.workspaceState.update("showFileOnly",  false);
		setButtonsAndContext();
		treeDataProvider.refresh();
	});
	vscode.commands.registerCommand('project-component-tree.all', function (){
		context.workspaceState.update("showComponentOnly",  false);
		context.workspaceState.update("showFileOnly",  false);
		setButtonsAndContext();
		treeDataProvider.refresh();
	});

	provView.onDidChangeSelection((e)=>{
		e.selection.forEach((node)=>{
			if(node.type === "placeholder" && node.label.startsWith("from:")){
				const nodeFilePath =   node.label.split("from:")[1];
				vscode.workspace.openTextDocument(nodeFilePath.trim()).then((document)=>vscode.window.showTextDocument(document));
			}
			else if(node.type === "component" && (node.count??0) < 1){
				vscode.workspace.openTextDocument(node.path.trim())
				.then((document)=>vscode.window.showTextDocument(document));
			}
		});

	});


	context.subscriptions.push(disposable);


	function setButtonsAndContext(){
		// get all default configurations here and setup init
		const isFileOnly =  context.workspaceState.get("showFileOnly",  false);
		const isComponentOnly =  context.workspaceState.get("showComponentOnly",  false);

		vscode.commands.executeCommand( 'setContext', 'profiler-file-only', isFileOnly);
		vscode.commands.executeCommand( 'setContext', 'profiler-component-only', isComponentOnly);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}

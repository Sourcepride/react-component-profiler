// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ComponentTreeBuilder } from './componentFinder';
import { ReactComponentProfiler } from './componentProfiler';
import { customDecorationProvider } from './customColorProvider';

/*
	
*/

let treeBuilder:ComponentTreeBuilder ;


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	setButtonsAndContext();
	vscode.window.registerFileDecorationProvider(new customDecorationProvider());

	treeBuilder =new ComponentTreeBuilder();
	const treeDataProvider = new ReactComponentProfiler(rootPath as string, treeBuilder, context);
	const provView = vscode.window.createTreeView('project-component-tree', {
		treeDataProvider: treeDataProvider
	});



	context.subscriptions.push(
			vscode.commands.registerCommand('project-component-tree.refreshEntry', ()=>{
			treeDataProvider.refresh();
		})
	);
	context.subscriptions.push( 
			vscode.commands.registerCommand('project-component-tree.onlyComponentFile', function (){
			context.workspaceState.update("showFileOnly",  true);
			context.workspaceState.update("showComponentOnly",  false);
			setButtonsAndContext();
			treeDataProvider.refresh();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('project-component-tree.onlyComponent', function (){
			context.workspaceState.update("showComponentOnly",  true);
			context.workspaceState.update("showFileOnly",  false);
			setButtonsAndContext();
			treeDataProvider.refresh();
		})
	);
	context.subscriptions.push(
			vscode.commands.registerCommand('project-component-tree.all', function (){
			context.workspaceState.update("showComponentOnly",  false);
			context.workspaceState.update("showFileOnly",  false);
			setButtonsAndContext();
			treeDataProvider.refresh();
		})
	);

	context.subscriptions.push(
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
	
		})
	);




	function setButtonsAndContext(){
		// get all default configurations here and setup init
		context.workspaceState.update("srcFolder",  vscode.workspace.getConfiguration("react-component-profiler").get("srcFolder") ?? "src");
		const isFileOnly =  context.workspaceState.get("showFileOnly",  false);
		const isComponentOnly =  context.workspaceState.get("showComponentOnly",  false);

		vscode.commands.executeCommand( 'setContext', 'profiler-file-only', isFileOnly);
		vscode.commands.executeCommand( 'setContext', 'profiler-component-only', isComponentOnly);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	treeBuilder.clear();
}

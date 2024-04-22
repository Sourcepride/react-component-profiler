import * as fs from 'fs';
import * as impPath from 'path';
import * as vscode from 'vscode';
import { ComponentTreeBuilder } from './componentFinder';
import { Node } from './trees';
import { ComponentFileRecordType, ComponentRecordType, ComponentTreeBuilderI, entityType, node } from './types';


/*
    define interface of componentTreeBuilder required
    
*/


export class ReactComponentProfiler implements vscode.TreeDataProvider<NodeInfo> {
    private _onDidChangeTreeData: vscode.EventEmitter<NodeInfo | undefined | null | void> = new vscode.EventEmitter<NodeInfo | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<NodeInfo | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string, private componentFinder:ComponentTreeBuilder, private readonly context_:vscode.ExtensionContext) {
        this.componentFinder.setSrcFolder(context_.workspaceState.get("srcFolder", "src"));
        this.componentFinder.createTreeDataStructures(this.workspaceRoot);
    }

    
  
    refresh(): void {
      this.componentFinder.createTreeDataStructures(this.workspaceRoot);
      this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: NodeInfo): vscode.TreeItem {
        return element;
    }

    getChildren(element?: NodeInfo): Thenable<NodeInfo[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No component in empty workspace');
            return Promise.resolve([]);
        }

        if (!this.componentFinder.isReactWorkspace){
            vscode.window.showInformationMessage('Can only work in a react project');
            return Promise.resolve([]);
        }



        if (element){
            let response: NodeInfo[];

            switch (element.type){
                case 'folder':{
                    response =  this.getFolderNodes(element.node as node, this.componentFinder);
                    break;
                }
                case 'file':{
                    response =  this.getFileNodes(element.node as node, this.componentFinder );
                    break;
                }
                case 'component': {
                    response =  this.getComponentNodes(element.path, element.label, this.componentFinder);
                    break;
                }
                case 'placeholder':{
                    response = element.label === "hooks"? this.getHooksNodes(element.path,  this.componentFinder) : [];
                    break;
                }
                default: response =  [];
            }



            return Promise.resolve(response);
        }else{
            const showFileOnly  =  this.context_.workspaceState.get("showFileOnly",false);
            const showComponentOnly  =  this.context_.workspaceState.get("showComponentOnly",false);
            if(showFileOnly && !showComponentOnly){
                const componentFilePaths =  this.componentFinder.getComponetsStore().keys();
                const rootPath = impPath.parse(impPath.parse(process.cwd()).root).root;

                const fakeFolderNode =  new Node(
                    Array.from(componentFilePaths).filter((key)=>!!(key.startsWith(rootPath) && this.componentFinder.getComponents(key.split(".")[0])?.components))
                    .map((val:string)=>{
                        const componentInfo  = this.componentFinder.getComponents(val.split(".")[0]) as ComponentFileRecordType;
                        return (
                            new Node(
                                [],
                                componentInfo.components.length,
                                "componentFile",
                                componentInfo.extension && !val.endsWith(`${componentInfo.extension}`)? `${val}.${componentInfo.extension}` : val 
                            )
                        );
                    }),
                    0,
                    "folder",
                    ""
                );
                return Promise.resolve(this.getFolderNodes(fakeFolderNode, this.componentFinder));
            }
            else if(!showFileOnly && showComponentOnly){
                const componentFilePaths =  this.componentFinder.getComponetsStore().keys();
                const rootPath = impPath.parse(impPath.parse(process.cwd()).root).root;

                let allComponents: {path:string,  comp:ComponentRecordType}[] = [];
                Array.from(componentFilePaths)
                    .filter((key)=>!!(key.startsWith(rootPath) && this.componentFinder.getComponents(key.split(".")[0])?.components))
                    .forEach((val:string)=>{
                        allComponents =  [ ...allComponents ,
                            ...(
                                (this.componentFinder.getComponents(val.split(".")[0]) as ComponentFileRecordType).components
                                .map((comp)=>{
                                    return {path:val,  comp};
                                })
                            )
                        ];
                    });

                
                    
                return Promise.resolve(allComponents.map((compObj)=>{
                        return new NodeInfo(
                                compObj.comp.name,
                                    undefined,
                                    "component",
                                    compObj.path,
                                    compObj.comp.usageCount,
                                    compObj.comp.usageCount >  0  ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
                                );
                    }
                ));
            }
            return Promise.resolve(this.getFolderNodes(this.componentFinder.getRootNode(), this.componentFinder));
        }

}


    private getFolderNodes(node: node| undefined,componentFinder:ComponentTreeBuilderI ){
        if(node === undefined){ return [];}

        const getLabel =  (child:node)=>{
            const pathSplit =  child.path.split(impPath.sep);
            return pathSplit[pathSplit.length - 1];
        };

        if(node.children.length >  0){
            return node.children.map((child)=>{
                if(child.type === "folder"){
                    if(child.children.length > 0){
                        return new NodeInfo(
                            getLabel(child),
                            child,
                            "folder",
                            child.path,
                            child.componentsCount,
                            vscode.TreeItemCollapsibleState.Collapsed
                        );
                    }
                    return new NodeInfo(
                        getLabel(child),
                        child,
                        "folder",
                        child.path,
                        child.componentsCount,
                        vscode.TreeItemCollapsibleState.None
                    );
                }else{
                    const components =  componentFinder.getComponents(child.path.split(".")[0]);
                    if(components){
                        return new NodeInfo(
                            getLabel(child),
                            child,
                            "file",
                            child.path,
                            child.componentsCount,
                            vscode.TreeItemCollapsibleState.Collapsed
                        );
                    }
                    return new NodeInfo(
                        getLabel(child),
                        child,
                        "file",
                        child.path,
                        child.componentsCount,
                        vscode.TreeItemCollapsibleState.None
                    );
                }
            });
        }

        return [];
    }


    private getFileNodes(node:node,componentFinder:ComponentTreeBuilderI){
        const components =  componentFinder.getComponents(node.path.split(".")[0]);
        const hooksTree =  new NodeInfo(
            "hooks",
            undefined,
            "placeholder",
            node.path,
            components? components.hooks.length :  0,
            vscode.TreeItemCollapsibleState.Collapsed
        );


        if(components){
            return [
                ...components.components.map((comp)=>{
                    return new NodeInfo(
                        comp.name,
                        undefined,
                        "component",
                        node.path,
                        comp.usageCount,
                        comp.usageCount >  0  ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
                    );
                }),
                hooksTree
            ];
        }
        
        return [hooksTree];
    }


    private getComponentNodes(compPath:string,componentName:string ,componentFinder:ComponentTreeBuilderI){
        const components =  componentFinder.getComponents(compPath.split(".")[0]);
        const componentName_  =  componentName.split(".").length > 0 ? componentName.split(".")[0] : componentName;

        if(components){
            const compInfo  =components.components.find((comp)=>comp.name === componentName_ );
            if(compInfo){
                return compInfo.pathFound.map((pathFound)=>{
                    return new NodeInfo(
                        `from: ${pathFound}`,
                        undefined,
                        "placeholder",
                        pathFound,
                        undefined,
                        vscode.TreeItemCollapsibleState.None
                    );
                });

            }

        }

        return [];
    }

    private getHooksNodes(filePath:string,componentFinder:ComponentTreeBuilderI){
        const components =  componentFinder.getComponents(filePath.split(".")[0]);
        if(components){
            return components.hooks.map((item)=>{
                return new NodeInfo(
                    item.name,
                    undefined,
                    "hook",
                    item.source,
                    undefined,
                    vscode.TreeItemCollapsibleState.None
                );
            });
        }

        return [];
    }


    private pathExists(p: string): boolean {
        try {
        fs.accessSync(p);
        } catch (err) {
        return false;
        }
        return true;
    }
    }

    class NodeInfo extends vscode.TreeItem {
        constructor(
            public readonly label: string,
            public readonly node: node | undefined,
            public readonly type: entityType,
            public readonly path: string,
            public readonly count:  number| undefined,
            public readonly collapsibleState: vscode.TreeItemCollapsibleState
        ) {
            super(label, collapsibleState);

            if(this.type === "hook" || this.type === "placeholder"){
                this.tooltip =  this.label;
            }else if (this.type === "component"){
                this.tooltip =  "Component usage information";
            }else{
                this.tooltip = "Components count";
            }

            if(["folder","file","component"].includes(this.type)){
                this.description =  `${this.label} ${type === "component"? "CU" : "C"}:(${this.count??0})`;
            }else{
                this.description =  `${this.label} ${type === "placeholder" && count? `${this.label.substring(0,1)}:(${count})` : "" }`;
            }

            this.resourceUri = vscode.Uri.parse(`profiler-${count}:`+path);

            const iconMap:Record<entityType, any> = {
                "folder": "folder",
                "component": {
                    light: impPath.join(__filename, '..', '..', 'resources', "react.svg"),
                    dark: impPath.join(__filename, '..', '..', 'resources', "react.svg")
                },
                "file":"file",
                "hook": {
                    light: impPath.join(__filename, '..', '..', 'resources', "hook.png"),
                    dark: impPath.join(__filename, '..', '..', 'resources', "hook.png")
                },
                "placeholder": "pinned"
            };

            this.iconPath = typeof iconMap[type] === "string"? new vscode.ThemeIcon(iconMap[type]) :  iconMap[type];

            // this.iconPath = {
            //     light: impPath.join(__filename, '..', '..', 'resources', iconMap[this.type]),
            //     dark: impPath.join(__filename, '..', '..', 'resources', iconMap[this.type])
            // };

            // this.description = this;
        }
}

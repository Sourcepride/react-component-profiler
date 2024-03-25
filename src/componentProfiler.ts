import * as fs from 'fs';
import * as impPath from 'path';
import * as vscode from 'vscode';
import { ComponentTreeBuilder } from './componentFinder';
import { ComponentTreeBuilderI, entityType, node } from './types';


/*
    define interface of componentTreeBuilder required
    
*/


export class ReactComponentProfiler implements vscode.TreeDataProvider<NodeInfo> {
    constructor(private workspaceRoot: string, private componentFinder:ComponentTreeBuilder) {
        this.componentFinder.createTreeDataStructures(this.workspaceRoot);
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

            const iconMap:Record<entityType, string> = {
                "folder": "folder.svg",
                "component": "react.svg",
                "file":"file.svg",
                "hook": "hook.png",
                "placeholder": ""
            };

            this.iconPath = {
                light: impPath.join(__filename, '..', '..', 'resources', iconMap[this.type]),
                dark: impPath.join(__filename, '..', '..', 'resources', iconMap[this.type])
            };

            // this.description = this;
        }
}

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ComponentTreeBuilderI, node } from './interface';


/*
    define interface of componentTreeBuilder required
    
*/


export class NodeDependenciesProvider implements vscode.TreeDataProvider<Dependency> {
    constructor(private workspaceRoot: string, private componentFinder:ComponentTreeBuilderI) {
        /*
            - call createTreeDataStructures from componentTreeBuilder with workspaceRoot
        */
        this.componentFinder.createTreeDataStructures(this.workspaceRoot);
    }

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Dependency): Thenable<Dependency[]> {

        /*            - check if ext is used in a work space
            - check if ext is used in a react installed workspace
            - get tree for fpath to display for path given
            - display given tree
                - for loop through tree array
                - check if node is a folder
                    - yes:  create dependency of type folder with node component count [expanded false but expandable yes]
                    - no:  create dependency of type component [expanded false but expandable yes]
                

        */


        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No component in empty workspace');
            return Promise.resolve([]);
        }

        if (!this.componentFinder.isReactWorkspace){
            vscode.window.showInformationMessage('Can only work in a react project');
            return Promise.resolve([]);
        }

        const tree =  this.componentFinder.getSubNodes(element?.node);
        

        if (element) {
        return Promise.resolve(
            this.getDepsInPackageJson(
            path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')
            )
        );
        } else {
        const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        if (this.pathExists(packageJsonPath)) {
            return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
        } else {
            vscode.window.showInformationMessage('Workspace has no package.json');
            return Promise.resolve([]);
        }
        }
}

    /**
     * Given the path to package.json, read all its dependencies and devDependencies.
     */
    // private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
    //     if (this.pathExists(packageJsonPath)) {
    //     const toDep = (moduleName: string, version: string): Dependency => {
    //         if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
    //         return new Dependency(
    //             moduleName,
    //             version,
    //             vscode.TreeItemCollapsibleState.Collapsed
    //         );
    //         } else {
    //         return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None);
    //         }
    //     };

    //     const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    //     const deps = packageJson.dependencies
    //         ? Object.keys(packageJson.dependencies).map(dep =>
    //             toDep(dep, packageJson.dependencies[dep])
    //         )
    //         : [];
    //     const devDeps = packageJson.devDependencies
    //         ? Object.keys(packageJson.devDependencies).map(dep =>
    //             toDep(dep, packageJson.devDependencies[dep])
    //         )
    //         : [];
    //     return deps.concat(devDeps);
    //     } else {
    //     return [];
    //     }
    // }

    private pathExists(p: string): boolean {
        try {
        fs.accessSync(p);
        } catch (err) {
        return false;
        }
        return true;
    }
    }

    class Dependency extends vscode.TreeItem {
    constructor(
        public readonly node:  node,
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };
}
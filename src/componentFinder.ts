import * as fs from "fs";
import * as path from 'path';
import { Node, Tree } from "./trees";

let _TREE_DS =  new Tree();
let _COMPONENT_MAP =  new Map();
let _HOOKS_MAP =  new Map(); // incase of another tree for all hooks and components that called them
/*
    implement component tree builder interface
*/


class ComponentTreeBuilder{
    public isReactWorkspace: boolean;


    constructor (){
        this.isReactWorkspace =  false;
    }

    public createTreeDataStructures(workspacePath: string){
        if(!(workspacePath && this.isReactProject(workspacePath))){ return;}


        /*
            - call  isReactProject
            - if true:
                - start DFS tree iteration by calling  findAllComponents
        */
        const rootNode =  Node.createNewNode(path.join(workspacePath,  "src"));
        _TREE_DS.root = rootNode;

        this.depthFirstFolderTreeTraversal(rootNode);



    }

    private depthFirstFolderTreeTraversal(node:Node): number{
        const stat =  fs.statSync(node.path);
        if(stat.isFile()){
            node.type =  "componentFile";
            /*
                count how many components are in the file;
                create an array of objects with hook-name:path
                if component is not in hashmap
                add component to component hash map with path + filename: [{
                    name: component Name
                    usageCount: 0,
                    foundIn: [path]
                    hooks: [{hook-name:path}]
                }]

                find all import that match Component import
                check if component path exists in hashmap as a key (src +  import path[create resolver func if relative])
                add if not exists and increment the usageCount to + 1 then add path to foundIn array
                return component count
            */
            return 0;
        }

        const subFileArray =  fs.readdirSync(node.path);
        let componentCount =  0;
        subFileArray.forEach((file)=>{
            if (!this.isReactFileOrFolder(file)){ return; }

            const subNode = Node.createNewNode(path.join(node.path,  file));
            node.children.push(subNode);
            componentCount += this.depthFirstFolderTreeTraversal(subNode);
        });
        

        node.componentsCount =  componentCount;
        return componentCount;
    }


    private isReactFileOrFolder(file:string):boolean{
        const stat =  fs.statSync(file);
        if(stat.isDirectory()){
            return true;
        }else if (stat.isFile() ){
            const pathSplit =  file.split(".");
            if (pathSplit.length > 1 && ["js","tsx","jsx"].indexOf(pathSplit[1]) !== -1 ){
                return true;
            }
        }
        return false;
    }
    /*
        A {node}
        |
       B-C
       |
    D-E-F
    need to know 
    */


    private findAllComponents(file:string){
        /*
                count how many components are in the file;
                create an array of objects with hook-name:path
                if component is not in hashmap
                add component to component hash map with path + filename: { components: [{
                    name: component Name
                    usageCount: 0,
                    foundIn: [path]
                }]
                hooks: [{hook-name:path}]
            }

                find all import that match Component import
                check if component path exists in hashmap as a key (src +  import path[create resolver func if relative])
                add if not exists and increment the usageCount to + 1 then add path to foundIn array
                return component count
            */
        const fileContent = fs.readFileSync(file, "utf8");
        const componentNames =  this.getAllDefinedComponents(fileContent);
        const hooksObjectsRep =  this.getAllHooksUsed(fileContent);
        const componentDepenencies =  this.getAllImportedComponents(fileContent);

        this.appendComponentsToHashMap(componentNames, file);
        this.updateUsageRecord(componentDepenencies,  file);
        this.updateHooksRecord(hooksObjectsRep);

        return componentNames.length;
    }


    private getAllDefinedComponents(fileContent:Buffer){

        return [];
    }


    private pickOne (){
        /*
            - pick one item direct child items of folder if it is a folder, .js file,.tsx file or .jsx file
            -  if desired file exits return Node
            -  else return undefined
        */
    }



    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }


    public isReactProject(projectRootPath:  string): boolean{
        const srcPath:string =  path.join(projectRootPath,  "src");
        const packageDotJsonPath:string =  path.join(projectRootPath,  "package.json");
        if(!(this.pathExists(srcPath) && this.pathExists(packageDotJsonPath))) { return false; }
        
        // open = package.json read the content make it json=  go to the depenecies and check if react.js is present

        const config =  JSON.parse(fs.readFileSync(packageDotJsonPath,  "utf-8"));

        return !!(config?.dependencies?.react??null);
    }





}
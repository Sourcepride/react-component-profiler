import parser from "@babel/parser";
import traverse from "@babel/traverse";
import t, { Identifier, isVariableDeclarator } from "@babel/types";
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
    public workspacePath:  string;


    constructor (){
        this.isReactWorkspace =  false;
        this.workspacePath = "";
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
        this.workspacePath =  workspacePath;

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
            const len =  pathSplit.length;
            if (len > 1  && ["js","tsx","jsx"].indexOf(pathSplit[len - 1]) !== -1 ){
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


    private extraAllInformation(file:string):  number{
        let foundComponents =  0;
        const blockScopeReturnsJSX =  this.findIfScopeReturnsJSX;
        const storeComponent =  this.addComponentToHashMap;
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
        const fileContent = fs.readFileSync(file, "utf-8");
        const ast = parser.parse(fileContent, {
            sourceType: 'module',
            plugins: ['jsx'],
        });


        traverse(
            ast, {
                ArrowFunctionExpression(path){
                    const storeComponentAndIncrementCount =  ()=>{
                        if(!isVariableDeclarator(path.parent)) {return;}
                        foundComponents +=  1;
                        storeComponent(file,  (path.parent.id as Identifier).name);
                    };

                    if(t.isJSXElement(path.node.body) ||  t.isJSXFragment(path.node.body)){
                            
                        storeComponentAndIncrementCount();
                        return;
                    }
                    
                    if (blockScopeReturnsJSX(path.node.body)){
                        storeComponentAndIncrementCount();
                    }
                },
                    FunctionDeclaration(path){
                        if (blockScopeReturnsJSX(path.node.body)){
                            if(!path.node.id){ return;}
                            foundComponents +=  1;
                            storeComponent(file,  path.node.id.name);
                        }
                },
                ImportDeclaration(path){
                  //findAllHooks
                    path.node.specifiers.forEach((specifier)=>{
                        if(t.isImportSpecifier(specifier)
                            && t.isIdentifier(specifier.imported)
                            && specifier.imported.name.startsWith("use")
                        ){
                        console.log("named hook import");

                    }else if(
                        t.isImportDefaultSpecifier(specifier)
                        && t.isIdentifier(specifier.local)
                        && specifier.local.name.startsWith("use")){
                        console.log("default hook import");
                    }
                });

                  // Find all components
                path.node.specifiers.forEach((specifier)=>{
                    if(t.isImportSpecifier(specifier)
                        && t.isIdentifier(specifier.imported)
                        &&specifier.imported.name.match(/^[A-Z][a-zA-Z0-9]*$/)
                    ){
                        console.log("named component import");
                    }else if(t.isImportDefaultSpecifier(specifier) && specifier.local.name.match(/^[A-Z][a-zA-Z0-9]*$/)){
                        console.log("default component import");
                    }
                });

                console.log(path.node.source.value);
                 //parse and evaluate path if its a library or local
                }
            }
        );


        
        


        // const componentNames =  this.getAllDefinedComponents(fileContent);
        // const hooksObjectsRep =  this.getAllHooksUsed(fileContent);
        // const componentDepenencies =  this.getAllImportedComponents(fileContent);

        // this.appendComponentsToHashMap(componentNames, file);
        // this.updateUsageRecord(componentDepenencies,  file);
        // this.updateHooksRecord(hooksObjectsRep);

        // return componentNames.length;
        return foundComponents;
    }



    private findIfScopeReturnsJSX(inputBody: t.BlockStatement | t.Expression) :  boolean{
        if(!t.isBlockStatement(inputBody)){ return false;}
            
        let returnVal = false;
        inputBody.body.forEach((element)=>{
            if(!t.isReturnStatement(element)) {return 0;}

            if(t.isJSXElement(element.argument) ||  t.isJSXFragment(element.argument)){
                returnVal =  true;
            }
        });

        return returnVal;
    }


    private findAllImportedHooks(filename:string){
        //if path is relative resolve from filename /home/www/src/comp/A.tsx : ../pages/X.py -> /home/ww/src/pages/X.py
        //if path starts with @ check if it is a component defined in package.json else find definition of alias in webpack.config.js or .babelrc or vite.config.js
        //if no @ and . at the beginning of file then look for baseUrl in tsconfig.json or jsconfig.json in compilerOptions
    }

    private findAllImportedComponents(){

    }

    private resolveImportPath(filePath: string,  importPath:string){
        
    }


    private addComponentToHashMap(file:string,  componentName:string){
        const identifier =  file.split(".")[0];
        if(_COMPONENT_MAP.has(componentName)){ return; }

        _COMPONENT_MAP.set(
            identifier, {
                components: [
                    {
                        name:  componentName,
                        usageCount: 0,
                        pathFound: [],
                        exported: false, //TODO: future implementation
                    }
                ],
                hooks: [],
            }
        );
        
    }


    private getAllDefinedComponents(fileContent:Buffer){

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


    public isReactProject(projectRootPath:  string): boolean{
        const srcPath:string =  path.join(projectRootPath,  "src");
        const packageDotJsonPath:string =  path.join(projectRootPath,  "package.json");
        if(!(this.pathExists(srcPath) && this.pathExists(packageDotJsonPath))) { return false; }
        
        // open = package.json read the content make it json=  go to the depenecies and check if react.js is present

        const config =  JSON.parse(fs.readFileSync(packageDotJsonPath,  "utf-8"));

        return !!(config?.dependencies?.react??null);
    }
}
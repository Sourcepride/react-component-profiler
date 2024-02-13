import * as fs from "fs";
import * as path from 'path';

let TREE_DS;
let COMPONENT_MAP =  new Map();
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

    }

    /*
        A {node}
        |
       B-C
       |
    D-E-F
    need to know 
    */


    private findAllComponents(){
        /*
            -  create with root node src
            -  get all sub file and folder under src
            -  pick one if it is a folder or a .js,  .tsx or .jsx file [make this a function]
                - if folder and contains other sub items
                    recursively go down the drain till no sub folder
                    - call profile component if  .js,  .tsx or .jsx is found
        
        */
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
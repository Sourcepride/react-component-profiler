import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import * as fs from "fs";
import * as path from 'path';
import * as ts from 'typescript';


const _ALIASES:Record<string, string> = {};

export class ImportPathResolver{
    public constructor(public baseDir:string, public filePath:string ,public importPath:string){
    }


    public getImportSourcePath(){

        const dirPath =  path.dirname(this.filePath);
        const rootPath =  this.getRootPath();


        if(!this.importPath.startsWith(".") && this.isInstalledLibrary(this.importPath)){
            return this.importPath;
        }
        
        if(this.importPath.startsWith(".")){
            return path.resolve(dirPath,  this.importPath);
        }
        else if(this.importPath.startsWith("@")){
            return this.resolveAlias(this.importPath);
        }else{
            return this.resolveFromConfigInfo(rootPath);
        }
    }

    private getRootPath(){
        const dirPath =  path.dirname(this.filePath);

        let rootPath =  this.baseDir;
        if(!rootPath){
            const srcIndex  =  dirPath.indexOf("src");
            rootPath=  dirPath.substring(0,  srcIndex);
        }

        return rootPath;
    }


    private resolveAlias(importPath:string){
        const pathSplit =  importPath.split("/");
        const firstPathFraction = pathSplit[0];
        const innerComponentPath =  pathSplit.length > 1? pathSplit.splice(1,pathSplit.length) : [""];
        
        if(firstPathFraction in _ALIASES){return path.join(_ALIASES[firstPathFraction],...innerComponentPath); }

        this.getAllImportAlias();

        if(firstPathFraction in _ALIASES){return path.join(_ALIASES[firstPathFraction],...innerComponentPath); }

        return path.join(this.getRootPath() , "src",  importPath.substring(1));

    }

    private getAllImportAlias(){
        /*
            - get path aliases defined in webpack.config and resolve to root path
            - get all paths definition in tsconfig or jsconfig and resolve them to root path
            add all found aliases and their resolved path to _ALIAS object if alias is not there already
        */

        const webPackFile =   this.getWebpackConfig();
        if (webPackFile){
            this.getWebpackDefAlias(webPackFile);
        }

        const rootPath =  this.getRootPath();
        const configObject =  this.parseConfigJson(rootPath);


        if(!(Object.keys(configObject).length >  0)){
            return;
        }

        let baseUrl =  configObject?.compilerOptions?.baseUrl;
        const paths =  configObject?.compilerOptions?.paths;
        let basePath = "";

        if(paths){
            if(!baseUrl || baseUrl === "." || baseUrl === "./"){
                baseUrl = "";
                basePath =  this.getRootPath();
            }else{
                baseUrl = baseUrl.replace(/^(\.\/|\/)/, "");
                basePath = path.join(this.getRootPath(), baseUrl);
            }

            Array.from(Object.keys(paths)).forEach((key)=>{
                let alias =  key.split("/")[0];
                alias =  alias.startsWith("@")? alias : "@" +  alias;
                const regex = new RegExp(`^.*${baseUrl}`);
                const value = (baseUrl? paths[key].replace(regex,""):  paths[key]).replace(/\*$/, "");


                if(!_ALIASES[alias]){
                    //TODO:  windows useCase
                    _ALIASES[alias] =  path.resolve(basePath, value);
                    return;
                }
            });
            
        }
    }

    private resolveFromConfigInfo(rootPath: string){

            try{
                const jsonContent =  this.parseConfigJson(rootPath);

                const baseUrl =  jsonContent?.compilerOptions?.baseUrl??"src";
                

                if(baseUrl === "." ||  baseUrl === "./"){
                    return  path.join(rootPath,  this.importPath);
                }

                return path.join(rootPath,baseUrl.replace(/^(\.\/|\/)/, ""),  this.importPath);

            }catch(err){
                return path.join(rootPath, "src", this.importPath);
            }
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }

    private getWebpackConfig(){
        const files = fs.readdirSync(this.baseDir);
        for ( let file of files){
            if(file.startsWith("webpack.config")) {return file; }
        }

        return undefined;
    }

    private getWebpackDefAlias(webPackFile:string){
        const fileContent =  fs.readFileSync(webPackFile, "utf-8");
        const pathLib  =  path;
        const this_ =  this;

            const ast = parser.parse(fileContent, {
                sourceType: 'module',
            });
    
    
            traverse(
                ast, {
                    ObjectProperty(path) {
                        if(t.isIdentifier(path.node.key) && path.node.key.name === "alias"){
                            if(t.isObjectExpression(path.node.value)){
                                for(let i  of path.node.value.properties){
                                    if(!(i.type === "ObjectProperty")){continue ;}
                                    
                                    let  alias =  (i.key as t.StringLiteral).value;
                                    alias =  alias.startsWith("@")? alias : "@" +  alias;

                                    let value =  "";

                                    if(t.isStringLiteral(i.value)){
                                        value = i.value.value;
                                    }
                                    
                                    if(t.isCallExpression(i.value)){
                                        const found = i.value.arguments.find((item)=> (t.isStringLiteral(item)));
                                        if(!found) { continue; }
                                        value = (found as t.StringLiteral).value;
                                    }
                                    
                                    if(t.isTemplateLiteral(i.value)){
                                        const callExp = i.value.expressions.find((item)=> (t.isCallExpression(item)));
                                        // handle case where not found
                                        if(!callExp){continue;}
                                        const found = (callExp as t.CallExpression).arguments.find((item)=> (t.isStringLiteral(item)));
                                        if(!found) {continue;}
                                        value = (found as t.StringLiteral).value;
                                    }
                                    
                                    if(!_ALIASES[alias]){
                                        _ALIASES[alias] =  pathLib.resolve(this_.getRootPath(), value);
                                    }
                                }
                            }
                        }
                        }
                    }
            );
    }


    private parseConfigJson(rootPath:string){
        const configFile =   this.pathExists(path.join(rootPath ,  "tsconfig.json"))?  path.join(rootPath ,  "tsconfig.json") :  this.pathExists(path.join(rootPath ,  "jsconfig.json"))? path.join(rootPath ,  "jsconfig.json") : "";
        if(configFile){
            //remove single line comments
            const jsonDataWithoutSingleLineComments = fs.readFileSync(configFile, "utf-8").replace(/\/\/.*\n/g, '');
            // Remove multi-line comments
            const jsonDataWithoutComments = jsonDataWithoutSingleLineComments.replace(/\/\*[\s\S]*?\*\//g, '');
            return ts.parseConfigFileTextToJson(configFile, jsonDataWithoutComments).config;
        }

        return {};
    }


    private isInstalledLibrary(value:string){
        const packageJson =  JSON.parse(fs.readFileSync(path.join(this.getRootPath() ,  "package.json"),  "utf-8"));


        const splittedPath =  this.importPath.split("/");
        const firstPathFraction = splittedPath[0];
        const secondFraction = splittedPath.length > 1? `${splittedPath[0]}/${splittedPath[1]}` : firstPathFraction;

        for(let key of Object.keys(packageJson?.devDependencies??{})){
            if(key === firstPathFraction ||  key === secondFraction) {
                return true;
            }
        }

        
        for(let key of Object.keys(packageJson?.dependencies??{})){
            if(key === firstPathFraction ||  key === secondFraction) {
                return true;
            }
        }

        return false;
    }
}
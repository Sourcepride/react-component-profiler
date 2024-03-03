import { node, tree } from "./types";

export class Tree implements tree{

    public root:  node | undefined;

    constructor (){
        this.root =  undefined;
    }

    public insert(){
        //
    }


    public remove(){

    };

}



export class Node  implements node{
    constructor( public children: node[],public componentsCount: number,  public type: "folder" | "componentFile",  public path:string){
    }

    public static createNewNode(path:string){
        return new Node([],  0,  "folder",  path);
    }
}
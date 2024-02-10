

let TREE_DS;
let COMPONENT_MAP =  new Map();
/*
    implement component tree builder interface
*/


class ComponentTreeBuilder{
    constructor (){
        
    }

    public createTreeDataStructures(workspacePath: string){
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





}
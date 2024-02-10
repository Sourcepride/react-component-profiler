

export type node = {
    componentsCount:  number ,
    type: "folder" | "componentFile",
    children:  node[]
};


export type tree = {
    root: node
    insert: ()=>void,
    remove:  ()=>void,
};



export interface ComponentTreeBuilderI{
    createTreeDataStructures:  (rootPath:string)=>void
    isReactWorkspace:  boolean,
    getSubNodes:  (node:undefined) => node[]
}
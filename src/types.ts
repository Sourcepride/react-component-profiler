

export type node = {
    componentsCount:  number ,
    type: "folder" | "componentFile",
    children:  node[],
    path: string
};


export type tree = {
    root: node |  undefined
    insert: ()=>void,
    remove:  ()=>void,
};



export interface ComponentTreeBuilderI{
    createTreeDataStructures:  (rootPath:string)=>void
    isReactWorkspace:  boolean,
    getSubNodes:  (node:undefined) => node[]
}

export type ComponentFileRecordType = {
    components: ComponentRecordType[],
    hooks:  HooksRecordType[]
};
export type ComponentRecordType = {
    name:  string,
    usageCount: number,
    pathFound: string[],
    exported: boolean
};
export type HooksRecordType = {
    name:string,
    source:  string
};
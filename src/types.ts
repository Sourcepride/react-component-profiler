

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
    getRootNode:  ()=>node |  undefined,
    getComponents:   (identifier:string) =>ComponentFileRecordType |  undefined

}

export type ComponentFileRecordType = {
    components: ComponentRecordType[],
    hooks:  HooksRecordType[],
    extension: string
};
export type ComponentRecordType = {
    name:  string,
    usageCount: number,
    pathFound: string[],
    exported: boolean,
};
export type HooksRecordType = {
    name:string,
    source:  string
};

export type entityType =  "folder" |  "file" |  "component" |  "hook" | "placeholder";

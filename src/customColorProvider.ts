// register the decoration provider

import * as vscode from 'vscode';
import { CancellationToken, FileDecoration, FileDecorationProvider, ProviderResult, Uri } from "vscode";


// define the decoration provider
export class customDecorationProvider implements FileDecorationProvider {
    provideFileDecoration(uri: Uri, token: CancellationToken): ProviderResult<FileDecoration> {
        
        // https://code.visualstudio.com/api/references/theme-color#lists-and-trees
        if (uri.scheme.startsWith('profiler')) {
            const countValue:number =  +uri.scheme.split("-")[1];
            if (countValue > 100){
                return {
                    color: new vscode.ThemeColor('list.focusHighlightForeground'),
                    // badge: "1"
                };
            }
            
        }

        return undefined;
    }
}
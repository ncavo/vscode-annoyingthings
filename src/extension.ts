'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let targetFileExt: string[];

class CompletionItem extends vscode.CompletionItem {
    fileName: string = "";
    workingFile: boolean = false;
    count: number = 1;

    constructor(label: string) {
        super(label, vscode.CompletionItemKind.Text);
    }
}

class CompletionItemProvider {
    // resolveCompletionItem(item: CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
    //     console.log(item);
    //     return item;
    // }    

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        let dotPos = document.fileName.lastIndexOf(".");
        if(dotPos < 0) {
            return;
        }
        let fileExt = document.fileName.substring(dotPos + 1);
        if(targetFileExt.indexOf(fileExt) < 0) {
            return;
        }
        let line1 = document.lineAt(position).text;
        if(!line1.endsWith(";")) {
            return;
        }
        line1 = line1.trim();
        let tokens = line1.split(";");
        if(tokens.length > 3) {
            return;
        }
        let replaceWord = "";
        if(tokens.length > 2) {
            replaceWord = tokens[1];
        }
        let keyWord = tokens[0].trim();
        if(keyWord.length < 3) {
            return;
        }
        let completionItems: Array<CompletionItem> = [];
        for (let i = 0; i < vscode.workspace.textDocuments.length; i++) {
            let document2 = vscode.workspace.textDocuments[i];
            let fileName = document2.fileName.replace(/^.*(\\|\/|\:)/, '');
            let workingFile = true;
            if(vscode.workspace.textDocuments[i] !== document) {
                workingFile = false;
                let dotPos = fileName.lastIndexOf(".");
                if(dotPos < 0) {
                    continue;
                }
                let fileExt = fileName.substring(dotPos + 1);
                if(targetFileExt.indexOf(fileExt) < 0) {
                    continue;
                }        
            }
            let text = document2.getText();
            let p = 0;
            let k = 0;
            for(let i = 0; i <= text.length; i++) {
                if(i === text.length || text[i] === '\r' || text[i] === '\n') {
                    if(k === keyWord.length) {
                        let line2 = text.substring(p, i).trim();
                        let found = false;
                        for(let j = 0; j < completionItems.length; j++) {
                            if(completionItems[j].label === line2) {
                                found = true;
                                let item = completionItems[j];
                                item.count++;
                                if(workingFile && !item.workingFile) {
                                    item.fileName = fileName;
                                    item.workingFile = workingFile;
                                }    
                                break;
                            }
                        }
                        if(!found && line1 !== line2) {
                            let item = new CompletionItem(line2);
                            item.fileName = fileName;
                            item.workingFile = workingFile;
                            completionItems.push(item);
                        }
                    }
                    p = i + 1;
                    k = 0;
                    if(i === text.length) {
                        break;
                    }
                }
                if(k < keyWord.length && text[i] === keyWord[k]) {
                    k++;
                }
            }
        }
        completionItems.forEach((item) => {
            item.range = new vscode.Range(new vscode.Position(position.line, position.character - line1.length), new vscode.Position(position.line, position.character));
            item.filterText = keyWord + ";";
            item.detail = item.label;
            item.documentation = item.fileName + " (" + item.count + " times)";
            item.sortText = (item.workingFile ? "0" : "1") + (10000 - item.count) + item.label;
            if(replaceWord !== "") {
                
            }
        });
        return completionItems;
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const config = vscode.workspace.getConfiguration('annoyingThings');
    targetFileExt = config.get("targetFileExt", "").replace(/ /g, "").split(",");

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: '*' }, new CompletionItemProvider(), ";"));

    context.subscriptions.push(vscode.commands.registerCommand("annoyingThings.Reload", () => {
        console.log('annoyingThings.Reload');
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {
}
"use strict";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

interface RptFile {
    path: string,
    stats: fs.Stats
}

export function activate(context: vscode.ExtensionContext) {

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand("extension.openLastRpt", () => {
        // The code you place here will be executed every time your command is executed

        let baseFolderPath = "";
        const configuredPath = vscode.workspace.getConfiguration().get("rpt.differentRptFolder", "");
        if (configuredPath != "") {
            baseFolderPath = configuredPath;
        } else {
            if (process.platform === "win32") {
                baseFolderPath = path.join(process.env.LOCALAPPDATA, "Arma 3");
            } else if (process.platform === "linux") {
                // flatpak steam
                baseFolderPath = path.join(process.env.HOME, ".var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/compatdata/107410/pfx/drive_c/users/steamuser/AppData/Local/Arma 3/");
            } else if (process.platform === "darwin") {
                // Assumed macos path, not tested, need confirmation from a mac user
                baseFolderPath = path.join(process.env.HOME, "Library/Application Support/Steam/steamapps/common/Arma 3");
            }
            console.log("Using default path: " + baseFolderPath);
        }

        if (!fs.existsSync(baseFolderPath)) {
            if (configuredPath != "") {
                vscode.window.showErrorMessage("This folder doesn't exist: " + baseFolderPath);
            } else {
                vscode.window.showErrorMessage("You don't have the expected Arma 3 folder at: " + baseFolderPath);
            }
            return;
        }

        let dirInfo = fs.readdirSync(baseFolderPath);

        let rptFiles: Array<RptFile> = [];

        const rptExtension = ".rpt";

        for (let entry of dirInfo) {
            let currentPath = path.join(baseFolderPath, entry);
            let stats: fs.Stats = fs.lstatSync(currentPath);

            // has .rpt extension and is a file
            if ((entry.indexOf(rptExtension, entry.length - rptExtension.length) > -1) && stats.isFile()) {
                rptFiles.push({
                    path: currentPath,
                    stats: stats
                });
            }
        }

        if (rptFiles.length < 1) {
            vscode.window.showWarningMessage("You don't have any *.rpt files at: " + baseFolderPath);
            return;
        }

        rptFiles.sort((x, y) => {
            return new Date(y.stats.mtime).getTime() - new Date(x.stats.mtime).getTime();
        });

        let lastRptFile = rptFiles[0];

        // open the document
        vscode.workspace.openTextDocument(lastRptFile.path).then((document) => {
            // then show it
            vscode.window.showTextDocument(document, 1, false).then((editor) => {
                // and move the cursor to the end

                vscode.commands.executeCommand("cursorBottom");
                vscode.commands.executeCommand("cursorMove", {
                    to: "right",
                    by: "wrappedLine",
                    select: false,
                    value: 1
                });
            });
        });

    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

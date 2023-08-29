import * as vscode from "vscode"
import { getNonce } from "./util"

export class CatScratchEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new CatScratchEditorProvider(context)
    const providerRegistration = vscode.window.registerCustomEditorProvider(CatScratchEditorProvider.viewType, provider)
    return providerRegistration
  }

  private static readonly viewType = "soltg.editor"
  private static readonly scratchCharacters = ["😸", "😹", "😺", "😻", "😼", "😽", "😾", "🙀", "😿", "🐱"]

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    }
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview)

    function updateWebview() {
      webviewPanel.webview.postMessage({
        type: "update",
        text: document.getText(),
      })
    }

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview()
      }
    })

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose()
    })

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case "add":
          this.addNewScratch(document)
          return

        case "delete":
          this.deleteScratch(document, e.id)
          return
      }
    })

    updateWebview()
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "app",
        "dist",
        // 'assets',
        "index.js"
      )
    )

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "app",
        "dist",
        // 'assets',
        "index.css"
      )
    )

    const nonce = getNonce()

    return `
		<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

	<meta name="viewport" content="width=device-width, initial-scale=1.0">

	<link href="${styleResetUri}" rel="stylesheet" />

  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>

		`
  }

  private addNewScratch(document: vscode.TextDocument) {
    const json = this.getDocumentAsJson(document)
    const character =
      CatScratchEditorProvider.scratchCharacters[
        Math.floor(Math.random() * CatScratchEditorProvider.scratchCharacters.length)
      ]
    json.scratches = [
      ...(Array.isArray(json.scratches) ? json.scratches : []),
      {
        id: getNonce(),
        text: character,
        created: Date.now(),
      },
    ]

    return this.updateTextDocument(document, json)
  }

  private deleteScratch(document: vscode.TextDocument, id: string) {
    const json = this.getDocumentAsJson(document)
    if (!Array.isArray(json.scratches)) {
      return
    }

    json.scratches = json.scratches.filter((note: any) => note.id !== id)

    return this.updateTextDocument(document, json)
  }

  private getDocumentAsJson(document: vscode.TextDocument): any {
    const text = document.getText()
    if (text.trim().length === 0) {
      return {}
    }

    try {
      return JSON.parse(text)
    } catch {
      throw new Error("Could not get document as json. Content is not valid json")
    }
  }

  private updateTextDocument(document: vscode.TextDocument, json: any) {
    const edit = new vscode.WorkspaceEdit()

    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), JSON.stringify(json, null, 2))

    return vscode.workspace.applyEdit(edit)
  }
}

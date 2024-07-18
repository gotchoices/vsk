import * as vscode from 'vscode';

const zapTimeout = 1000
let zapActive = false
let zapStart: vscode.Position | null = null
let yankBuffer = ''
let suppressClear = false
let previousCursorPosition: vscode.Position | null = null;

export function activate(context: vscode.ExtensionContext) {	//console.log('activate vsk')
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.deleteLeftToBuf', deleteLeftToBuf),
    vscode.commands.registerCommand('extension.deleteRightToBuf', deleteRightToBuf),
    vscode.commands.registerCommand('extension.deleteLineToBuf', deleteLineToBuf),
    vscode.commands.registerCommand('extension.cursorLineStartPrev', cursorLineStartPrev),
    vscode.commands.registerCommand('extension.cursorLineEndNext', cursorLineEndNext),
    vscode.commands.registerCommand('extension.cursorLeft', () => cursorMoveWithZap('cursorLeft')),
    vscode.commands.registerCommand('extension.cursorRight', () => cursorMoveWithZap('cursorRight')),
    vscode.commands.registerCommand('extension.cursorUp', () => cursorMoveWithZap('cursorUp')),
    vscode.commands.registerCommand('extension.cursorDown', () => cursorMoveWithZap('cursorDown')),
    vscode.commands.registerCommand('extension.cursorWordStartLeft', () => cursorMoveWithZap('cursorWordStartLeft')),
    vscode.commands.registerCommand('extension.cursorWordEndRight', () => cursorMoveWithZap('cursorWordEndRight')),
    vscode.commands.registerCommand('extension.cursorTop', () => cursorMoveWithZap('cursorTop')),
    vscode.commands.registerCommand('extension.cursorBottom', () => cursorMoveWithZap('cursorBottom')),
    vscode.commands.registerCommand('extension.yankFromBuf', yankFromBuf),
    vscode.commands.registerCommand('extension.prefixZap', prefixZap)
  );

  vscode.window.onDidChangeTextEditorSelection((e) => {		//console.log('mot/sel')
    const editor = e.textEditor
    const currentCursorPosition = editor.selection.active

    if (!suppressClear && !zapActive &&
    	previousCursorPosition && !previousCursorPosition.isEqual(currentCursorPosition)) {
      yankBuffer = ''			//;console.log("clear yank")
    }
    previousCursorPosition = currentCursorPosition;
  })
}

function deleteLeftToBuf() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return			//;console.log('deleteLeftToBuf')

  suppressClear = true
  editor.edit(editBuilder => {
    let range = new vscode.Range(editor.selection.start.translate(0, -1), editor.selection.start)
    let text = editor.document.getText(range)
    editBuilder.delete(range)
    yankBuffer = text + yankBuffer
  }).then(() => {
    suppressClear = false
  })
}

function deleteRightToBuf() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return			//;console.log('deleteRightToBuf')

  suppressClear = true
  editor.edit(editBuilder => {
    let range = new vscode.Range(editor.selection.start, editor.selection.start.translate(0, 1))
    let text = editor.document.getText(range)
    editBuilder.delete(range)
    yankBuffer += text
  }).then(() => {
    suppressClear = false
  })
}

function deleteLineToBuf() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return			//;console.log('deleteLineToBuf')

  suppressClear = true
  editor.edit(editBuilder => {
    const line = editor.selection.active.line;
    const lineRange = new vscode.Range(
      editor.document.lineAt(line).range.start,
      line < editor.document.lineCount - 1 
          ? editor.document.lineAt(line + 1).range.start 
          : editor.document.lineAt(line).range.end
    );
    const text = editor.document.getText(lineRange);
    editBuilder.delete(lineRange);
    yankBuffer += text;
  }).then(() => {
    suppressClear = false
  })
}

function prefixZap() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return		//;console.log("prefixZap:")

  zapActive = true
  zapStart = editor.selection.active

  setTimeout(() => {zapActive = false}, zapTimeout)
}

function zapCheck() {
  const editor = vscode.window.activeTextEditor		//;console.log('zapCheck')
  if (!editor || !zapActive || !zapStart) return
  const zapEnd = editor.selection.active

  let range: vscode.Range
  let prepend: boolean = false;
  
  if (zapStart.isBefore(zapEnd)) {
    range = new vscode.Range(zapStart, zapEnd)
  } else {
    range = new vscode.Range(zapEnd, zapStart)
    prepend = true
  }

  const text = editor.document.getText(range)

  suppressClear = true
  editor.edit(editBuilder => {
    editBuilder.delete(range)
  }).then(() => {
    yankBuffer = prepend ? text + yankBuffer : yankBuffer + text
    zapActive = false
    zapStart = null
  }).then(() => {
    suppressClear = false
  })
}

function yankFromBuf() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return		//;console.log('yankFromBuf', editor)

  suppressClear = true
  editor.edit(editBuilder => {
    editBuilder.insert(editor.selection.start, yankBuffer)
  }).then(() => {
    suppressClear = false
  })
}

function cursorLineStartPrev() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return

  vscode.commands.executeCommand('cursorLeft').then(() => {
    vscode.commands.executeCommand('cursorLineStart').then(() => {
      zapCheck()
    })
  })
}

function cursorLineEndNext() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return

  vscode.commands.executeCommand('cursorRight').then(() => {
    vscode.commands.executeCommand('cursorLineEnd').then(() => {
      zapCheck()
    })
  })
}

function cursorMoveWithZap(move: string) {
  const editor = vscode.window.activeTextEditor
  if (!editor) return

  vscode.commands.executeCommand(move).then(() => {
    zapCheck()
  })
}

export function deactivate() {}

import * as vscode from 'vscode';

const zapTimeout = 1000			//ignore start of zap after this many msec
let yankBuffer = ''
let preClear = true			//true: clear before next zap to buffer
let previousCursorPosition: vscode.Position | null = null;

export function activate(context: vscode.ExtensionContext) {	//console.log('activate vsk')
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.cursorRight', () => moveSequence('cursorRight')),
    vscode.commands.registerCommand('extension.cursorLeft', () => moveSequence('cursorLeft')),
    vscode.commands.registerCommand('extension.cursorDown', () => moveSequence('cursorDown')),
    vscode.commands.registerCommand('extension.cursorUp', () => moveSequence('cursorUp')),
    vscode.commands.registerCommand('extension.cursorWordEnd', () => moveSequence('cursorWordEndRight')),
    vscode.commands.registerCommand('extension.cursorWordStart', () => moveSequence('cursorWordStartLeft')),
    vscode.commands.registerCommand('extension.cursorLineEnd', () => moveSequence(['cursorRight','cursorLineEnd'])),
    vscode.commands.registerCommand('extension.cursorLineStart', () => moveSequence(['cursorLeft','cursorLineStart'])),
    vscode.commands.registerCommand('extension.cursorPageEnd', () => moveSequence(()=>page())),
    vscode.commands.registerCommand('extension.cursorPageStart', () => moveSequence(()=>page(true))),
    vscode.commands.registerCommand('extension.cursorDocStart', () => moveSequence('cursorTop')),
    vscode.commands.registerCommand('extension.cursorDocEnd', () => moveSequence('cursorBottom')),

    vscode.commands.registerCommand('extension.zapRight', () => zapSequence('cursorRight')),
    vscode.commands.registerCommand('extension.zapLeft', () => zapSequence('cursorLeft')),
    vscode.commands.registerCommand('extension.zapDown', () => zapSequence('cursorDown')),
    vscode.commands.registerCommand('extension.zapUp', () => zapSequence('cursorUp')),
    vscode.commands.registerCommand('extension.zapWordEnd', () => zapSequence('cursorWordEndRight')),
    vscode.commands.registerCommand('extension.zapWordStart', () => zapSequence('cursorWordStartLeft')),
    vscode.commands.registerCommand('extension.zapLineEnd', () => zapSequence(['cursorRight','cursorLineEnd'])),
    vscode.commands.registerCommand('extension.zapLineStart', () => zapSequence(['cursorLeft','cursorLineStart'])),
    vscode.commands.registerCommand('extension.zapPageEnd', () => zapSequence(()=>page())),
    vscode.commands.registerCommand('extension.zapPageStart', () => zapSequence(()=>page(true))),
    vscode.commands.registerCommand('extension.zapDocEnd', () => zapSequence('cursorBottom')),
    vscode.commands.registerCommand('extension.zapDocStart', () => zapSequence('cursorTop')),

    vscode.commands.registerCommand('extension.zapLine', async () => {
      await zapSequence('cursorLineEnd')
      await zapSequence('cursorLineStart')
      await zapSequence('cursorRight')
    }),
    vscode.commands.registerCommand('extension.yank', yank),
    vscode.commands.registerCommand('extension.center', center),
    vscode.commands.registerCommand('extension.saveClose', () => rawSequence(['workbench.action.files.save','workbench.action.closeActiveEditor']))
  );
}

function yank() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return		//;console.log('yankFromBuf', editor)

  const position = editor.selection.start;
  editor.edit(editBuilder => {
    editBuilder.insert(editor.selection.start, yankBuffer)
  }).then(() => {
    editor.selection = new vscode.Selection(position, position)
  })
}

async function moveSequence(moves: any) {
  await rawSequence(moves)
  preClear = true			//;console.log("preClear = true")
}

async function zapSequence(moves: any) {
  const editor = vscode.window.activeTextEditor
  if (!editor) return					//;console.log("Zap:")
  const zapStart = editor.selection.active		//;console.log('zapStart:', zapStart)

  await rawSequence(moves)

  const zapEnd = editor.selection.active		//;console.log('zapEnd:', zapEnd)
  let range: vscode.Range
  let prepend: boolean = false
  
  if (zapStart.isBefore(zapEnd)) {
    range = new vscode.Range(zapStart, zapEnd)
  } else {
    range = new vscode.Range(zapEnd, zapStart)
    prepend = true
  }

  const text = editor.document.getText(range)

  if (preClear) yankBuffer = ''
  preClear = false			//;console.log("preClear = false")

  editor.edit(editBuilder => {
    editBuilder.delete(range)
  }).then(() => {
    yankBuffer = prepend ? text + yankBuffer : yankBuffer + text
  })
}

async function rawSequence(moves: any) {
  if (!vscode?.window?.activeTextEditor) return
  const movesArray = (Array.isArray(moves)) ? moves : [moves]

  for (const move of movesArray) {		//console.log('raw m:', typeof move, move)
    if (typeof move === 'function') 
      await move()
    else if (typeof move === 'string') 
      await vscode.commands.executeCommand(move)
  }
}

function page(back = false) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const eofLine = editor.document.lineCount - 1;
  const curLine = editor.selection.active.line;
  const curColumn = editor.selection.active.character;
  const visibleRange = editor.visibleRanges[0];
  const firstLine = visibleRange.start.line;
  const lastLine = visibleRange.end.line;	
  const lines = lastLine - firstLine;
  let gotoLine, newFirstLine = 0, newLastLine = 0;
  let doReveal = false;

  if (back) {
    if (curLine > firstLine) {
      gotoLine = firstLine
    } else {
      gotoLine = firstLine - lines
      if (gotoLine < 0) gotoLine = 0
      newFirstLine = gotoLine
      newLastLine = gotoLine + lines
      if (newLastLine > eofLine) newLastLine = eofLine
      doReveal = true
    }
  } else {
    if (curLine < lastLine) {
      gotoLine = lastLine
    } else {
      gotoLine = lastLine + lines
      if (gotoLine > eofLine) gotoLine = eofLine
      newLastLine = gotoLine
      newFirstLine = gotoLine - lines
      if (newFirstLine < 0) newFirstLine = 0
      doReveal = true
    }
  }			;console.log('page:', firstLine, '-', lastLine, gotoLine)

  const newPosition = new vscode.Position(gotoLine, curColumn)
  const newSelection = new vscode.Selection(newPosition, newPosition);

  editor.selection = newSelection;
  if (doReveal) {
    const firstPos = new vscode.Position(newFirstLine, curColumn)
    const lastPos = new vscode.Position(newLastLine, curColumn)
    const newRange = new vscode.Range(firstPos, lastPos)
    editor.revealRange(newRange, 0);		;console.log('reveal:', newFirstLine, newLastLine, gotoLine)
  }
}

function center() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const line = editor.selection.active.line;

  vscode.commands.executeCommand('revealLine', {
    lineNumber: line,
    at: 'center'
  });
}

export function deactivate() {}

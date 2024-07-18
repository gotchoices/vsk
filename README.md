# vsk README
VSK implements a set of simple featues and a keymap to facilitate more rapid text editing.

In traditional keymaps, functions have sometimes been assigned to a key that
might be easy to remember.  For example, Ctrl-F might be used for "find."
With many function, it can become hard to find a memorable key assignment for everything.

VSK uses two strategies:
- First, try to consolidate the most commonly used motion commands into
  keys that are most easily reachable without having to move your hands.
  Ideally, you shouldn't have to resort to the arrow keys.
- Second, arrange the basic keymap to give you more of a tactile feel
  (rather than a typographical association) over your text.

Imagine you hold the body of the text between your hands.
Your left hand pushes to the right.
Your right hand pushes to the left.
Whatever a finger on your left hand does, the right hand does the opposite.

After using this layout for a short time, it becomes very intuitive to
manipulate the text

## Features
VSK adds only a few features:
- Basic motion
- Zapping (cut to buffer)
- Yanking (paste from buffer)

All the rest of Visual Studio's features should remain intact at their usual key loctions.

### Basic Motion
- By character: Ctrl-F, Ctrl-J
- By word: Ctrl-V, Ctrl-N
- By line: Ctrl-R, Ctrl-U
- By page: Ctrl-T, Ctrl-Y
- By file: Ctrl-W, Ctrl-O

### Zapping / Yanking
- Zap one character: Ctrl-G, Ctrl-H
- Zap to destination: Ctrl-L, followed by a motion command
- Yank: Ctrl-B

Zap/yank operates independently from the regular cut/copy/paste buffer.

## Conclusion
Enjoy speedy editing!

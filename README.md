# mmheroes

This is Javascript port of DOS text quest game "mmheroes" http://mmheroes.chat.ru/hmm.htm (originally Borland Pascal 7.0).

Obtained by handmade decompilation, process is described at https://sharpc.livejournal.com/75856.html (in Russian).

Available at https://esix.github.io/demo/mmheroes/

![Screenshot](https://github.com/sharpden/mmheroes/blob/master/screenshot.png?raw=true)

## Running the game

### Terminal (Node.js)

```
npm start
```

Runs the game directly in your terminal using Node.js. Works on macOS, Linux, and Windows 10+. Use arrow keys to navigate menus, Ctrl-C to exit.

### Web (browser)

```
npm run web
```

Starts a webpack dev server. Navigate to `http://localhost:8080` in your browser after the server starts.

### Build for production

```
npm run build
```

Produces a production bundle in `dist/`.

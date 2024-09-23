const keyBuffer = [];
const readKeyWaiters = [];

function onKeyDown(event) {
  if (event.keyCode === 116 || event.keyCode === 16 || event.keyCode === 17 || event.keyCode === 18 || event.keyCode === 91) {
    return;
  }
  if (readKeyWaiters.length) {
    readKeyWaiters.shift()(event.keyCode);
  } else {
    keyBuffer.push(event.keyCode);
  }
}

document.body.addEventListener('keydown', onKeyDown, false);


export function ReadKey() {
  return new Promise((resolve, reject) => {
    if (keyBuffer.length) {
      resolve(keyBuffer.shift());
    } else {
      readKeyWaiters.push(resolve);
    }
  });
}

export function ReadKey() {
  return new Promise((resolve, reject) => {
    const eventHandler = (event) => {
      if (event.keyCode === 116 || event.keyCode === 16 || event.keyCode === 17 || event.keyCode === 18 || event.keyCode === 91) {
        return;
      }
      console.log('event.keyCode=', event.keyCode);
      document.body.removeEventListener('keydown', eventHandler, false);
      resolve(event.keyCode);
    };
    document.body.addEventListener('keydown', eventHandler, false);
  });
}


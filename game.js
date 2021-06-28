async function run() {
  /* Setup */

  const font = new FontFace('Ugly Terminal 8', 'url(ugly-terminal-8.ttf)')
  await font.load()
  document.fonts.add(font)

  const display = new ROT.Display({
    width: 40,
    height: 30,
    fontSize: 16,
    fontFamily: '"Ugly Terminal 8", monospace',
    forceSquareRatio: true,
  })
  const canvas = display.getContainer()

  document.getElementById('game').appendChild(canvas)

  canvas.addEventListener('keydown', (event) => {
    act(actions[event.keyCode])
    draw()
  })
  canvas.addEventListener('pointerdown', () => {
    canvas.focus()
  })
  canvas.setAttribute('tabindex', '1')
  canvas.focus()

  /* State */

  const player = {
    x: 5,
    y: 4,
    ch: '@',
  }

  /* Process */

  const actions = {
    [ROT.KEYS.VK_RIGHT]: { type: 'move', x: +1, y: 0 },
    [ROT.KEYS.VK_LEFT]: { type: 'move', x: -1, y: 0 },
    [ROT.KEYS.VK_DOWN]: { type: 'move', x: 0, y: +1 },
    [ROT.KEYS.VK_UP]: { type: 'move', x: 0, y: -1 },
  }
  const act = (action) => {
    switch (action?.type) {
      case 'move':
        const { x, y } = action
        player.x += x
        player.y += y
        break
    }
  }

  const drawCharacter = ({ x, y, ch }) => {
    display.draw(x, y, ch)
  }
  const draw = () => {
    display.clear()
    drawCharacter(player)
  }
  draw()
}
run()

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

  const createEntity = (type, x, y) => ({ id: ++createEntity.id, type, x, y })
  createEntity.id = 0

  const player = createEntity('player', 5, 4)
  const troll = createEntity('troll', 20, 10)

  const visuals = {
    player: ['@', 'hsl(60, 100%, 50%)'],
    troll: ['T', 'hsl(120, 60%, 50%)'],
    orc: ['o', 'hsl(100, 30%, 50%)'],
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

  const drawEntity = (entity) => {
    const [ch, fg, bg] = visuals[entity.type]
    display.draw(entity.x, entity.y, ch, fg, bg)
  }
  const draw = () => {
    display.clear()
    drawEntity(player)
    drawEntity(troll)
  }
  draw()
}
run()

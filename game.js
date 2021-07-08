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

  const entities = new Map()
  const createEntity = (type, x, y) => {
    const id = ++createEntity.id
    const entity = { id, type, x, y }
    entities.set(id, entity)
    return entity
  }
  createEntity.id = 0

  const player = createEntity('player', 5, 4)
  const troll = createEntity('troll', 20, 10)

  const createMap = (width, height) => {
    const map = {
      width,
      height,
      tiles: new Map(),
      key(x, y) {
        return `${x},${y}`
      },
      get(x, y) {
        return this.tiles.get(this.key(x, y))
      },
      set(x, y, value) {
        this.tiles.set(this.key(x, y), value)
      },
    }

    const digger = new ROT.Map.Digger(width, height)
    digger.create((x, y, contents) => map.set(x, y, contents))
    return map
  }
  const map = createMap(80, 60)

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

  /* Draw */

  const drawMap = (map) => {
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.get(x, y)) {
          display.draw(x, y, '⨉', 'hsl(60, 10%, 40%)', 'gray')
        } else {
          display.draw(x, y, '·', 'hsl(60, 50%, 50%)', 'black')
        }
      }
    }
  }

  const entityVisuals = {
    player: ['@', 'hsl(60, 100%, 50%)'],
    troll: ['T', 'hsl(120, 60%, 50%)'],
    orc: ['o', 'hsl(100, 30%, 50%)'],
  }
  const drawEntity = (entity) => {
    const [ch, fg, bg] = entityVisuals[entity.type]
    display.draw(entity.x, entity.y, ch, fg, bg)
  }

  const draw = () => {
    display.clear()
    drawMap(map)
    for (const entity of entities.values()) {
      drawEntity(entity)
    }
  }
  draw()
}
run()

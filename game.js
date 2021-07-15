async function run() {
  /* Setup */

  const WIDTH = 40
  const HEIGHT = 30

  const font = new FontFace('Ugly Terminal 8', 'url(ugly-terminal-8.ttf)')
  await font.load()
  document.fonts.add(font)

  const display = new ROT.Display({
    width: WIDTH,
    height: HEIGHT,
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

  /* Utility */

  const randomNum = (min, max) => min + (max - min) * Math.random()
  const randomInt = (min, max) =>
    Math.ceil(min) + Math.floor((max - Math.ceil(min)) * Math.random())

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
  const map = createMap(WIDTH, HEIGHT)

  const placeEntityRandomlyInMap = (
    entity,
    map,
    minX = 0,
    minY = 0,
    maxX = WIDTH,
    maxY = HEIGHT,
  ) => {
    let limit = 10000
    while (limit >= 0) {
      const x = randomInt(minX, maxX)
      const y = randomInt(minY, maxY)
      if (map.get(x, y) === 0) {
        entity.x = x
        entity.y = y
        return
      }
    }
  }

  placeEntityRandomlyInMap(player, map)
  placeEntityRandomlyInMap(troll, map)

  /* Process */

  const actions = {
    [ROT.KEYS.VK_RIGHT]: { type: 'move', dx: +1, dy: 0 },
    [ROT.KEYS.VK_LEFT]: { type: 'move', dx: -1, dy: 0 },
    [ROT.KEYS.VK_DOWN]: { type: 'move', dx: 0, dy: +1 },
    [ROT.KEYS.VK_UP]: { type: 'move', dx: 0, dy: -1 },
  }
  const act = (action) => {
    switch (action?.type) {
      case 'move':
        const { dx, dy } = action
        const x_ = player.x + dx
        const y_ = player.y + dy
        if (map.get(x_, y_) === 0) {
          player.x = x_
          player.y = y_
        }
        break
    }
  }

  /* Draw */

  const entityVisuals = {
    player: { ch: '@', fg: 'hsl(60, 100%, 50%)', bg: null },
    troll: { ch: 'T', fg: 'hsl(120, 60%, 50%)', bg: null },
    orc: { ch: 'o', fg: 'hsl(100, 30%, 50%)', bg: null },
  }
  const mapVisuals = {
    // wall
    [true]: {
      [true]: { ch: ' ', fg: null, bg: 'hsl(0, 0%, 8%)' },
      [false]: { ch: ' ', fg: null, bg: 'hsl(0, 0%, 0%)' },
    },
    // floor
    [false]: {
      [true]: { ch: '·', fg: 'hsl(52, 30%, 40%)', bg: 'hsl(52, 30%, 20%)' },
      [false]: { ch: ' ', fg: null, bg: 'hsl(52, 0%, 15%)' },
    },
  }
  const fov = new ROT.FOV.PreciseShadowcasting((x, y) => map.get(x, y) === 0)

  const draw = () => {
    display.clear()

    const lightMap = new Map() // map key to 0.0–1.0
    fov.compute(player.x, player.y, 10, (x, y, r, visibility) => {
      lightMap.set(map.key(x, y), visibility)
    })

    const glyphMap = new Map() // map key to [char, fg, optional bg]
    for (const entity of entities.values()) {
      glyphMap.set(map.key(entity.x, entity.y), entityVisuals[entity.type])
    }

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const lit = lightMap.get(map.key(x, y)) > 0.0
        const wall = map.get(x, y) !== 0
        const glyph = glyphMap.get(map.key(x, y))
        let { ch, fg, bg } = mapVisuals[wall][lit]
        if (glyph) {
          ch = lit ? glyph.ch : ch
          fg = glyph.fg
          bg = glyph.bg || bg
        }
        display.draw(x, y, ch, fg, bg)
      }
    }
  }
  draw()
  console.log(display)
}
run()

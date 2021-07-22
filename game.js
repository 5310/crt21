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

  const entityAt = (x, y) => {
    for (const entity of entities.values()) {
      if (entity.x === x && entity.y === y) return entity
    }
    return
  }

  const entityProps = {
    player: {
      blocks: true,
      visuals: { ch: '@', fg: 'hsl(60, 100%, 50%)', bg: null },
    },
    troll: {
      blocks: true,
      visuals: { ch: 'T', fg: 'hsl(120, 60%, 50%)', bg: null },
    },
    orc: {
      blocks: true,
      visuals: { ch: 'o', fg: 'hsl(100, 30%, 50%)', bg: null },
    },
  }

  const createMonsters = (room, maxMonstersPerRoom) => {
    console.log(room)
    const numMonsters = randomInt(0, maxMonstersPerRoom)
    for (let i = 0; i < numMonsters; i++) {
      const x = randomInt(room.getLeft(), room.getRight())
      const y = randomInt(room.getTop(), room.getBottom())
      if (!entityAt(x, y)) {
        const type = randomInt(0, 3) === 0 ? 'troll' : 'orc'
        createEntity(type, x, y)
      }
    }
  }

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
    map.rooms = digger.getRooms()
    map.corridors = digger.getCorridors()

    for (let room of map.rooms) {
      createMonsters(room, 3)
    }

    return map
  }
  const map = createMap(WIDTH, HEIGHT)
  const exploreMap = new Map()

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
      if (map.get(x, y) === 0 && !entityAt(x, y)) {
        entity.x = x
        entity.y = y
        return
      }
    }
  }

  const player = createEntity('player', 5, 4)
  placeEntityRandomlyInMap(player, map)

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
          const target = entityAt(x_, y_)
          if (target && entityProps[target.type].blocks) {
            console.log(
              `You kick the ${target.type} in the shins, much to its annoyance!`,
            )
            // TODO: draw this to the screen
          } else {
            player.x = x_
            player.y = y_
          }
        }
        break
    }
  }

  const enemiesMove = () => {
    for (let entity of entities) {
      if (entity !== player) {
        console.log(`The ${entity.type} ponders the meaning of its existence.`)
      }
    }
  }

  /* Draw */

  const mapVisuals = {
    // wall
    wall: {
      lit: { ch: ' ', fg: null, bg: 'hsl(0, 0%, 8%)' },
      unlit: { ch: ' ', fg: null, bg: 'hsl(0, 0%, 0%)' },
    },
    // floor
    floor: {
      lit: { ch: '·', fg: 'hsl(52, 30%, 40%)', bg: 'hsl(52, 30%, 20%)' },
      unlit: { ch: ' ', fg: null, bg: 'hsl(0, 0%, 0%)' },
      explored: { ch: ' ', fg: null, bg: 'hsl(52, 0%, 15%)' },
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
      glyphMap.set(
        map.key(entity.x, entity.y),
        entityProps[entity.type].visuals,
      )
    }

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const lit = lightMap.get(map.key(x, y)) > 0.0
        const wall = map.get(x, y) !== 0
        const glyph = glyphMap.get(map.key(x, y))
        if (!wall && lit) exploreMap.set(map.key(x, y), true)
        const explored = exploreMap.get(map.key(x, y))
        let { ch, fg, bg } =
          mapVisuals[wall ? 'wall' : 'floor'][
            explored ? 'explored' : lit ? 'lit' : 'unlit'
          ]
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

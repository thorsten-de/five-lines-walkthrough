
const TILE_SIZE = 30;
const FPS = 30;
const SLEEP = 1000 / FPS;

interface FallingState {
  drop(map: Map, tile: Tile, x: number, y: number): void
  moveHorizontal(player: Player, tile: Tile, dx: number): void
}

class Falling implements FallingState {
  moveHorizontal(player: Player, tile: Tile, dx: number): void {    
  }

  drop(map: Map, tile: Tile, x: number, y: number) {
    map.drop(tile, x, y);
  }
}

class Resting implements FallingState {
  moveHorizontal(player: Player, tile: Tile, dx: number): void {
    player.pushHorizontal(tile, dx);
  }
  drop(map: Map, tile: Tile, x: number, y: number): void { }
}

class FallStrategy {
  constructor(private falling: FallingState) {
  }

  moveHorizontal(player: Player, tile: Tile, dx: number): void {
    return this.falling.moveHorizontal(player, tile, dx);
  }

  update(map: Map, tile: Tile, x: number, y: number): void {
    this.falling = map.getBlockOnTopState(x, y);
    this.falling.drop(map, tile, x, y);
  }
}

interface RemoveStrategy {
  check(tile: Tile): boolean;
}

class RemoveIdLock implements RemoveStrategy {
  constructor(
    private key_id: number
  ) {}

  check(tile: Tile): boolean {
    return tile.fits(this.key_id);
  }
}

enum RawTile {
  AIR,
  FLUX,
  UNBREAKABLE,
  PLAYER,
  STONE, FALLING_STONE,
  BOX, FALLING_BOX,
  KEY1, LOCK1,
  KEY2, LOCK2
}

const TILE_CREATORS : Object = {
  0: (map: Map) => new Air(map),
  1: (map: Map) =>  new Air(map),
  2: (map: Map) => new PlayerTile(map),
  3: (map: Map) => new Unbreakable(map),
  4: (map: Map) => new Stone(map, new Falling()),
  5: (map: Map) => new Stone(map, new Resting()),
  6: (map: Map) => new Box(map, new Resting()),
  7: (map: Map) => new Box(map, new Falling()),
  8: (map: Map) => new Flux(map),
  9: (map: Map) => new Key(map, YELLOW_KEY),
  10: (map: Map) => new Key(map, OHTER_KEY),
  11: (map: Map) => new LockTile(map, YELLOW_KEY),
  12: (map: Map) => new LockTile(map, OHTER_KEY),
}

abstract class Tile {
  constructor(
    protected map: Map
  ){}

  isAir(): boolean { return false; }
  fits(key_id: number): boolean { return false; }
  getBlockOnTopState(): FallingState { return new Resting(); }

  update(x: number, y: number): void {  }
  moveVertical(player: Player, dy: number): void { }
  abstract moveHorizontal(player: Player, dx: number): void;
  abstract draw(g: CanvasRenderingContext2D, x: number, y: number): void;
}

class Air extends Tile {
  isAir() { return true; }

  override getBlockOnTopState(): FallingState {
    return new Falling();
  }

  moveHorizontal(player: Player, dx: number) {
    player.move(dx, 0);
  }

  moveVertical(player: Player, dy: number): void {
    player.move(0, dy);
  }

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
  }
}

class Flux extends Tile {
  moveHorizontal(player: Player, dx: number) {
    player.move(dx, 0);
  }

  moveVertical(player: Player, dy: number): void {
    player.move(0, dy);
  }

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#ccffcc";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

class Unbreakable extends Tile {
  moveHorizontal(player: Player, dx: number) {}

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#999999";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

class PlayerTile extends Tile {
  moveHorizontal(player: Player, dx: number) {}

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
  }
}

class Stone extends Tile {
  private fallStrategy: FallStrategy;
  constructor(map: Map, falling: FallingState) {
    super(map);
    this.fallStrategy = new FallStrategy(falling);
  }

  moveHorizontal(player: Player, dx: number) {
    this.fallStrategy
      .moveHorizontal(player, this, dx);
  }

  update(x: number, y: number): void {
    this.fallStrategy.update(this.map, this,x, y);
  }

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#0000cc";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

class Box extends Tile {
  private fallStrategy: FallStrategy;
  constructor(map: Map, falling: FallingState) {
    super(map);
    this.fallStrategy = new FallStrategy(falling);
  }

  moveHorizontal(player: Player, dx: number) {
    this.fallStrategy
      .moveHorizontal(player, this, dx);
  }

  update(x: number, y: number): void {
    this.fallStrategy.update(this.map, this, x, y);
  }

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#8b4513";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

class KeyConfiguration {

  private removeStrategy: RemoveStrategy;
  constructor(
    private color: string,
    private key_id: number,
  ){
    this.removeStrategy = new RemoveIdLock(key_id);
  }

  setColor(g: CanvasRenderingContext2D) {
    g.fillStyle = this.color;
  }
  unlock(map: Map) {
    map.remove(this.removeStrategy);
  }
  fits(key_id: number): boolean {
    return this.key_id === key_id;
  }
}

class Key extends Tile {
  constructor(map: Map, private configuration: KeyConfiguration) {
    super(map);
  }

  moveVertical(player: Player, dy: number): void {
    this.configuration.unlock(this.map)
    player.move(0, dy);
  }

  moveHorizontal(player: Player, dx: number) {
    this.configuration.unlock(this.map)
    player.move(dx, 0);
  }
  
  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    this.configuration.setColor(g);
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

class LockTile extends Tile {
  constructor(map: Map, private configuration: KeyConfiguration) {
    super(map);
  }

  fits(key_id: number): boolean {
    return this.configuration.fits(key_id);
  }

  moveHorizontal(player: Player, dx: number) { }
  
  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    this.configuration.setColor(g);
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

enum RawInput {
  UP, DOWN, LEFT, RIGHT
}

interface Input {
  handle(player: Player): void;
}

class Right implements Input {
  handle(player: Player) {
    player.moveHorizontal(1);
  }
}

class Left implements Input {
  handle(player: Player) {
    player.moveHorizontal(-1);
  }
}

class Up implements Input {
  handle(player: Player) {
    player.moveVertical(-1);
  }
}

class Down implements Input {
  handle(player: Player) {
    player.moveVertical(1);
  }
}

class Player {
  constructor(
    private map: Map,
    private x: number,
    private y: number
  ) { }

  draw(g: CanvasRenderingContext2D) {
    g.fillStyle = "#ff0000";
    g.fillRect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  pushHorizontal(tile: Tile, dx: number) {
    this.map.pushHorizontal(this, this.x, this.y, tile, dx);
  }
  
  moveHorizontal(dx: number) {
    this.map.moveHorizontal(this, this.x, this.y, dx);
  }

  moveVertical(dy: number) {
    this.map.moveVertical(this, this.x, this.y, dy);
  }


  move(dx: number, dy: number) {
    this.moveToTile(this.x + dx, this.y + dy);
  }

  moveToTile(newx: number, newy: number) {
    this.map.movePlayer(this.x, this.y, newx, newy)
    this.x = newx;
    this.y = newy;
  }
}

class Map {
  private map: Tile[][];

  static FromTiles(tiles: RawTile[][]): Map {
    let newMap = new Map();
    newMap.map = newMap.transform(tiles);
    return newMap;
  }

  private constructor(){  }

  private transform(tiles: RawTile[][]): Tile[][] {
    return tiles.map(row => row.map(tile => Map.transformTile(this, tile)));
  }

  private static transformTile(map: Map, tile: RawTile): Tile {
    switch (tile) {
      case RawTile.AIR: return new Air(map);
      case RawTile.PLAYER: return new PlayerTile(map)
      case RawTile.UNBREAKABLE: return new Unbreakable(map);
      case RawTile.STONE: return new Stone(map, new Falling());
      case RawTile.FALLING_STONE: return new Stone(map, new Resting());
      case RawTile.BOX: return new Box(map, new Resting());
      case RawTile.FALLING_BOX: return new Box(map, new Falling());
      case RawTile.FLUX: return new Flux(map);
      case RawTile.KEY1: return new Key(map, YELLOW_KEY);
      case RawTile.KEY2: return new Key(map, OHTER_KEY);
      case RawTile.LOCK1: return new LockTile(map, YELLOW_KEY);
      case RawTile.LOCK2: return new LockTile(map, OHTER_KEY);
      default: assertExhausted(tile);
    }
  }

  remove(shouldRemove: RemoveStrategy) {
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        if (shouldRemove.check(this.map[y][x])) {
          this.map[y][x] = new Air(this);
        }
      }
    }
  }

  update() {
    for (let y = this.map.length - 1; y >= 0; y--) {
      for (let x = 0; x < this.map[y].length; x++) {
        this.map[y][x].update(x, y);
      }
    }
  }

  draw(g: CanvasRenderingContext2D) {
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        this.map[y][x].draw(g, x, y);
      }
    }
  }

  movePlayer(x: number, y: number, newx: number, newy: number) {
    this.map[y][x] = new Air(this);
    this.map[newy][newx] = new PlayerTile(this);
  }

  moveHorizontal(player: Player, x: number, y: number, dx: number) {
    this.map[y][x + dx].moveHorizontal(player, dx);
  }

  moveVertical(player: Player, x: number, y: number, dy: number) {
    this.map[y + dy][x].moveVertical(player, dy);
  }

  pushHorizontal(player: Player, x: number, y: number, tile: Tile, dx: number) {
    if (this.map[y][x + dx + dx].isAir()
            && !this.map[y + 1][x + dx].isAir()) {
      this.map[y][x + dx + dx] = tile;
      player.moveToTile(x + dx, y);
    }
  }

  drop(tile: Tile, x: number, y: number) {
    this.map[y + 1][x] = tile;
    this.map[y][x] = new Air(this);
  }

  getBlockOnTopState(x: number, y: number) {
    return this.map[y + 1][x].getBlockOnTopState();
  }
}

let rawMap: RawTile[][] = [
  [2, 2, 2, 2, 2, 2, 2, 2],
  [2, 3, 0, 1, 1, 2, 0, 2],
  [2, 4, 2, 6, 1, 2, 0, 2],
  [2, 8, 4, 1, 1, 2, 0, 2],
  [2, 4, 1, 1, 1, 9, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2],
];


function assertExhausted(x: never): never {
  throw new Error("Unexpected object: " + x);
}

const YELLOW_KEY = new KeyConfiguration("#ffcc00", 1);
const OHTER_KEY = new KeyConfiguration("#00ccff", 2);

let inputs: Input[] = [];

function update(player: Player, map: Map) {
  handleInputs(player);
  map.update();
}

function handleInputs(player: Player) {
  while (inputs.length > 0) {
    let current = inputs.pop();
    current.handle(player);
  }
}

function draw(player: Player, map: Map) {
  let g = createGraphics();
  map.draw(g);
  player.draw(g);
}

function createGraphics() {
  let canvas = document.getElementById("GameCanvas") as HTMLCanvasElement;
  let g = canvas.getContext("2d");

  g.clearRect(0, 0, canvas.width, canvas.height);
  return g;
}

function gameLoop(player: Player, map: Map) {
  let before = Date.now();
  update(player, map);
  draw(player, map);
  let after = Date.now();
  let frameTime = after - before;
  let sleep = SLEEP - frameTime;
  setTimeout(() => gameLoop(player, map), sleep);
}

window.onload = () => {
  let map : Map  = Map.FromTiles(rawMap);
  let player: Player = new Player(map, 1, 1);
  gameLoop(player, map);
}

const LEFT_KEY = "ArrowLeft";
const UP_KEY = "ArrowUp";
const RIGHT_KEY = "ArrowRight";
const DOWN_KEY = "ArrowDown";
window.addEventListener("keydown", e => {
  if (e.key === LEFT_KEY || e.key === "a") inputs.push(new Left());
  else if (e.key === UP_KEY || e.key === "w") inputs.push(new Up());
  else if (e.key === RIGHT_KEY || e.key === "d") inputs.push(new Right());
  else if (e.key === DOWN_KEY || e.key === "s") inputs.push(new Down());
});

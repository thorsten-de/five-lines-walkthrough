
const TILE_SIZE = 30;
const FPS = 30;
const SLEEP = 1000 / FPS;

interface FallingState {
  isFalling(): boolean
  moveHorizontal(tile: Tile, dx: number):void
}

class Falling implements FallingState {
  isFalling() { return true;  }
  moveHorizontal(tile: Tile, dx: number): void {    
  }
}

class Resting implements FallingState {
  moveHorizontal(tile: Tile, dx: number): void {
    if (map[playery][playerx + dx + dx].isAir()
            && !map[playery + 1][playerx + dx].isAir()) {
        map[playery][playerx + dx + dx] = tile;
        moveToTile(playerx + dx, playery);
      }
  }
  isFalling() { return false; }
}

class FallStrategy {
  constructor(private falling: FallingState) {
  }

  moveHorizontal(tile: Tile, dx: number): void {
    return this.falling.moveHorizontal(tile, dx);
  }

  update(tile: Tile, x: number, y: number): void {
    this.falling = map[y + 1][x].isAir() 
      ? new Falling()
      : new Resting();
    if (this.falling.isFalling()) {
      this.drop(tile, x, y);  
    }    
  }

  private drop(tile: Tile, x: number, y: number) {
    map[y + 1][x] = tile;
    map[y][x] = new Air();
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

abstract class Tile {
  isAir(): boolean { return false; }
  fits(key_id: number): boolean { return false; }

  update(x: number, y: number): void {  }
  moveVertical(dy: number): void { }
  abstract moveHorizontal(dx: number): void;
  abstract draw(g: CanvasRenderingContext2D, x: number, y: number): void;
}

class Air extends Tile {
  isAir() { return true; }

  moveHorizontal(dx: number) {
    moveToTile(playerx + dx, playery);
  }

  moveVertical(dy: number): void {
    moveToTile(playerx, playery + dy);
  }

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
  }
}

class Flux extends Tile {
  moveHorizontal(dx: number) {
    moveToTile(playerx + dx, playery);
  }

  moveVertical(dy: number): void {
    moveToTile(playerx, playery + dy);
  }

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#ccffcc";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

class Unbreakable extends Tile {
  moveHorizontal(dx: number) {}

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#999999";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

class Player extends Tile {
  moveHorizontal(dx: number) {}

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
  }
}

class Stone extends Tile {
  private fallStrategy: FallStrategy;
  constructor(falling: FallingState) {
    super();
    this.fallStrategy = new FallStrategy(falling);
  }

  moveHorizontal(dx: number) {
    this.fallStrategy
      .moveHorizontal(this, dx);
  }

  update(x: number, y: number): void {
    this.fallStrategy.update(this,x, y);
  }

  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#0000cc";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

class Box extends Tile {
  private fallStrategy: FallStrategy;
  constructor(falling: FallingState) {
    super();
    this.fallStrategy = new FallStrategy(falling);
  }

  moveHorizontal(dx: number) {
    this.fallStrategy
      .moveHorizontal(this, dx);
  }

  update(x: number, y: number): void {
    this.fallStrategy.update(this, x, y);
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
  unlock() {
    remove(this.removeStrategy);
  }
  fits(key_id: number): boolean {
    return this.key_id === key_id;
  }
}

class Key extends Tile {
  constructor(private configuration: KeyConfiguration) {
    super();
  }

  moveVertical(dy: number): void {
    this.configuration.unlock()
    moveToTile(playerx, playery + dy);
  }

  moveHorizontal(dx: number) {
    this.configuration.unlock()
    moveToTile(playerx + dx, playery);
  }
  
  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    this.configuration.setColor(g);
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

class LockTile extends Tile {
  constructor(private configuration: KeyConfiguration) {
    super();
  }

  fits(key_id: number): boolean {
    return this.configuration.fits(key_id);
  }

  moveHorizontal(dx: number) { }
  
  override draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    this.configuration.setColor(g);
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

enum RawInput {
  UP, DOWN, LEFT, RIGHT
}

interface Input {
  handle(): void;
}

class Right implements Input {
  handle() {
    moveHorizontal(1);
  }
}

class Left implements Input {
  handle() {
    moveHorizontal(-1);
  }
}

class Up implements Input {
  handle() {
    moveVertical(-1);
  }
}

class Down implements Input {
  handle() {
    moveVertical(1);
  }
}

let playerx = 1;
let playery = 1;
let rawMap: RawTile[][] = [
  [2, 2, 2, 2, 2, 2, 2, 2],
  [2, 3, 0, 1, 1, 2, 0, 2],
  [2, 4, 2, 6, 1, 2, 0, 2],
  [2, 8, 4, 1, 1, 2, 0, 2],
  [2, 4, 1, 1, 1, 9, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2],
];

let map: Tile[][];

function transformMap() {
  map = rawMap.map(row => row.map(transformTile));
}

function assertExhausted(x: never): never {
  throw new Error("Unexpected object: " + x);
}

const YELLOW_KEY = new KeyConfiguration("#ffcc00", 1);
const OHTER_KEY = new KeyConfiguration("#00ccff", 2);

function transformTile(tile: RawTile): Tile {
  switch (tile) {
    case RawTile.AIR: return new Air();
    case RawTile.PLAYER: return new Player();
    case RawTile.UNBREAKABLE: return new Unbreakable();
    case RawTile.STONE: return new Stone(new Falling());
    case RawTile.FALLING_STONE: return new Stone(new Resting());
    case RawTile.BOX: return new Box(new Resting());
    case RawTile.FALLING_BOX: return new Box(new Falling());
    case RawTile.FLUX: return new Flux();
    case RawTile.KEY1: return new Key(YELLOW_KEY);
    case RawTile.KEY2: return new Key(OHTER_KEY);
    case RawTile.LOCK1: return new LockTile(YELLOW_KEY);
    case RawTile.LOCK2: return new LockTile(OHTER_KEY);
    default: assertExhausted(tile);
  }
}

let inputs: Input[] = [];

function remove(shouldRemove: RemoveStrategy) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (shouldRemove.check(map[y][x])) {
        map[y][x] = new Air();
      }
    }
  }
}

function moveToTile(newx: number, newy: number) {
  map[playery][playerx] = new Air();
  map[newy][newx] = new Player();
  playerx = newx;
  playery = newy;
}

function moveHorizontal(dx: number) {
  map[playery][playerx + dx].moveHorizontal(dx);
}

function moveVertical(dy: number) {
  map[playery + dy][playerx].moveVertical(dy);
}

function update() {
  handleInputs();
  updateMap();
}

function updateMap() {
  for (let y = map.length - 1; y >= 0; y--) {
    for (let x = 0; x < map[y].length; x++) {
      updateTile(y, x);
    }
  }
}

function updateTile(y: number, x: number) {
  map[y][x].update(x, y);
}

function handleInputs() {
  while (inputs.length > 0) {
    let current = inputs.pop();
    current.handle();
  }
}

function draw() {
  let g = createGraphics();
  drawMap(g);
  drawPlayer(g);
}

function createGraphics() {
  let canvas = document.getElementById("GameCanvas") as HTMLCanvasElement;
  let g = canvas.getContext("2d");

  g.clearRect(0, 0, canvas.width, canvas.height);
  return g;
}

function drawMap(g: CanvasRenderingContext2D) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      map[y][x].draw(g, x, y);
    }
  }
}

function drawPlayer(g: CanvasRenderingContext2D) {
  g.fillStyle = "#ff0000";
  g.fillRect(playerx * TILE_SIZE, playery * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function gameLoop() {
  let before = Date.now();
  update();
  draw();
  let after = Date.now();
  let frameTime = after - before;
  let sleep = SLEEP - frameTime;
  setTimeout(() => gameLoop(), sleep);
}

window.onload = () => {
  transformMap();
  gameLoop();
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


class Game {
   constructor() {
      this.lifes = 5;
      this.mariobBig = false;
      this.score = 0;
      this.gameOver = false;
   }

   addScore = () => {
      this.score++;
   };

   makeMarioBig = () => {
      this.mariobBig = true;
   };

   addLife = () => {
      this.lifes++;
   };
}

const config = {
   type: Phaser.AUTO,
   width: 1000,
   height: 600,
   pixelArt: true,
   scene: {
      preload: preload,
      create: create,
      update: update,
   },
   physics: {
      default: "arcade",
      arcade: { debug: false },
   },
};
var game = new Phaser.Game(config);

function preload() {
   this.load.crossOrigin = "anonymous";

   this.load.tilemapTiledJSON(
      "map1",
      "https://examples.phaser.io/assets/tilemaps/maps/super_mario.json"
   );
   this.load.image(
      "tiles1",
      "https://examples.phaser.io/assets/tilemaps/tiles/super_mario.png"
   );

   this.load.spritesheet("player", "assets/marioSmall.png", {
      frameWidth: 34,
      frameHeight: 34,
   });

   this.load.spritesheet("enemy", "assets/enemy.png", {
      frameWidth: 49,
      frameHeight: 41,
   });
}

let cursors;
let map1;
let layer1;
let tileset1;
let controls;
let player;
let jump;
let gameoverText;
let winText;
let gameOver = false;
const END_GAME = 7953;
let reset;
let gameInstance;
let scoreText;
let enemy;

function create() {
   gameInstance = new Game();

   map1 = this.make.tilemap({ key: "map1" });
   tileset1 = map1.addTilesetImage("SuperMarioBros-World1-1", "tiles1");

   layer1 = map1.createLayer("World1", tileset1, 0, 0);

   //kolizje
   map1.setCollision([
      14, 15, 16, 20, 21, 22, 23, 24, 25, 27, 28, 29, 33, 39, 40,
   ]);

   //kolizja z coinem
   map1.setTileIndexCallback(11, getCoin, this);
   //czerwony grzyb
   map1.setTileIndexCallback(12, makeMarioBig, this);

   //zielony grzyb
   map1.setTileIndexCallback(18, addLife, this);

   const SCALE = game.scale.height / layer1.height;

   layer1.setScale(SCALE);

   cursors = this.input.keyboard.createCursorKeys();

   player = this.physics.add.sprite(50, 100, "player");
   player.setCollideWorldBounds(true, true, false, false);
   player.setBounce(0.2);
   player.body.gravity.y = 700;

   enemy = this.physics.add.sprite(1000, 100, "enemy");
   enemy.body.gravity.y = 500;

   //kamera
   this.cameras.main.setBounds(
      0,
      0,
      layer1.width * SCALE,
      layer1.height * SCALE
   );
   this.physics.world.setBounds(
      0,
      0,
      layer1.width * SCALE,
      layer1.height * SCALE
   );
   this.cameras.main.startFollow(player);

   //animacje
   this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", {
         frames: [2, 4, 5],
      }),
      frameRate: 10,
      repeat: -1,
   });
   this.anims.create({
      key: "front",
      frames: [{ key: "player", frame: 0 }],
      frameRate: 20,
   });
   this.anims.create({
      key: "jump",
      frames: this.anims.generateFrameNumbers("player", { frames: [6] }),
      frameRate: 10,
      repeat: -1,
   });

   //gameover - LOSE
   gameoverText = this.add.text(
      this.physics.world.bounds.centerX,
      250,
      "GAME OVER",
      {
         font: "60px ",
         fill: "#ffffff",
         align: "center",
      }
   );
   gameoverText.setOrigin(0.5);
   gameoverText.visible = false;

   //gameover - WIN
   winText = this.add.text(
      this.physics.world.bounds.centerX,
      250,
      "YOU WIN \nPress enter to reset game",
      {
         font: "60px ",
         fill: "#ffffff",
         align: "center",
      }
   );
   winText.setOrigin(0.5);
   winText.visible = false;

   //score
   scoreText = this.add.text(
      16,
      16,
      `Score: ${gameInstance.score} \nLifes: ${gameInstance.lifes}`,
      {
         fontSize: "32px",
         fill: "#000",
      }
   );
   scoreText.setScrollFactor(0);
   reset = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
}

let isJumping = false;

function update() {
   this.physics.collide(player, layer1);
   this.physics.collide(enemy, layer1);

   if (enemy.body.onFloor()) enemy.setVelocityX(-100);

   if (!gameOver) {
      if (cursors.up.isDown) {
         isJumping = true;
         player.anims.play("jump");
         if (player.body.touching.down || player.body.onFloor())
            player.setVelocityY(-500);
      } else isJumping = false;

      if (cursors.left.isDown) {
         player.setVelocityX(-300);
         if (!isJumping) {
            player.anims.play("left", true);
            player.scaleX = -1;
         }
      } else if (cursors.right.isDown) {
         player.setVelocityX(300);
         if (!isJumping) {
            player.anims.play("left", true);
            player.scaleX = 1;
         }
      } else {
         player.setVelocityX(0);
         if (!isJumping) player.anims.play("front");
      }

      if (player.y > game.scale.height - 40) {
         const screenCenterX =
            this.cameras.main.worldView.x + this.cameras.main.width / 2;
         const screenCenterY =
            this.cameras.main.worldView.y + this.cameras.main.height / 2;
         player.disableBody(true, true);
         gameoverText.y = screenCenterY;
         gameoverText.x = screenCenterX;
         gameoverText.visible = true;
         gameOver = true;
      }

      if (player.x === END_GAME) {
         const screenCenterX =
            this.cameras.main.worldView.x + this.cameras.main.width / 2;
         const screenCenterY =
            this.cameras.main.worldView.y + this.cameras.main.height / 2;

         winText.y = screenCenterY;
         winText.x = screenCenterX;
         winText.visible = true;
         gameOver = true;
      }
   }
   if (gameOver && reset.isDown) {
      this.registry.destroy(); // destroy registry
      this.events.off(); // disable all active events
      this.scene.restart(); // restart current scene
      gameOver = false;
   }
}
function getCoin(sprite, coin) {
   if (sprite === player) {
      layer1.replaceByIndex(11, 1, coin.x, coin.y, 1, 1);
      gameInstance.addScore();
      scoreText.setText(
         `Score: ${gameInstance.score} \nLifes: ${gameInstance.lifes}`
      );
   }
}

function makeMarioBig(sprite, mushroom) {
   if (sprite === player) {
      layer1.replaceByIndex(12, 1, mushroom.x, mushroom.y, 1, 1);
      gameInstance.makeMarioBig();
      player.scaleY = 2;
   }
}

function addLife(sprite, mushroom) {
   if (sprite === player) {
      layer1.replaceByIndex(18, 1, mushroom.x, mushroom.y, 1, 1);
      gameInstance.addLife();
      scoreText.setText(
         `Score: ${gameInstance.score} \nLifes: ${gameInstance.lifes}`
      );
   }
}

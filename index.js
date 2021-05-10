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

   // this.load.spritesheet(
   //    "player",
   //    "https://examples.phaser.io/assets/games/starstruck/dude.png",
   //    {
   //       frameWidth: 32,
   //       frameHeight: 48,
   //    }
   // );
   this.load.spritesheet("player", "assets/marioSmall.png", {
      frameWidth: 34,
      frameHeight: 34,
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

function create() {
   map1 = this.make.tilemap({ key: "map1" });
   tileset1 = map1.addTilesetImage("SuperMarioBros-World1-1", "tiles1");

   layer1 = map1.createLayer("World1", tileset1, 0, 0);

   //kolizje
   map1.setCollision([
      14,
      15,
      16,
      20,
      21,
      22,
      23,
      24,
      25,
      27,
      28,
      29,
      33,
      39,
      40,
   ]);

   map1.setTileIndexCallback(11, getCoin, this);

   const SCALE = game.scale.height / layer1.height;

   layer1.setScale(SCALE);

   cursors = this.input.keyboard.createCursorKeys();

   player = this.physics.add.sprite(50, 100, "player");
   player.setCollideWorldBounds(true, true, true, false);
   player.setBounce(0.2);
   player.body.gravity.y = 500;

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
      frames: this.anims.generateFrameNumbers("player", { frames: [2, 4, 5] }),
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

   reset = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
}
let isJumping = false;

function update() {
   this.physics.collide(player, layer1);

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

      if (player.y > game.scale.height - 20) {
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
function getCoin(player, coin) {
   layer1.replaceByIndex(11, 1, coin.x, coin.y, 1, 1);
}

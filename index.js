//klasa z danymi rozgrywki
class Game {
   constructor() {
      this.lifes = 5;
      this.mariobBig = false;
      this.score = 0;
      this.gameOver = false;
      this.youWin = false;
      this.bullets = 0;
   }

   addScore = (score) => {
      if (score === undefined) this.score++;
      else this.score += score;
   };

   makeMarioBig = () => {
      this.mariobBig = true;
   };

   makeMarioSmall = () => {
      this.mariobBig = false;
   };

   addLife = () => {
      this.lifes++;
   };

   dead = () => {
      this.lifes--;
      this.score = 0;
      this.bullets = 0;
      if (this.lifes === 0) this.gameOver = true;
   };

   win = () => {
      this.youWin = true;
   };

   addBullets = (count) => {
      this.bullets += count;
   };
}

//klasa przeciwnika
class Enemy {
   constructor() {
      this.isAlive = true;
      this.direction = true;
   }

   dead = () => {
      this.isAlive = false;
   };

   changeDirection = () => {
      this.direction = !this.direction;
   };
}

//konfiguracja gry
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
var game = new Phaser.Game(config); // tworzenie gry

function preload() {
   this.load.crossOrigin = "anonymous";

   //mapa
   this.load.tilemapTiledJSON(
      "map1",
      "https://examples.phaser.io/assets/tilemaps/maps/super_mario.json"
   );
   //tiles do mapy
   this.load.image(
      "tiles1",
      "https://examples.phaser.io/assets/tilemaps/tiles/super_mario.png"
   );
   //pilka
   this.load.image(
      "ball",
      "https://examples.phaser.io/assets/sprites/green_ball.png"
   );
   //mario
   this.load.spritesheet("player", "assets/marioSmall.png", {
      frameWidth: 34,
      frameHeight: 34,
   });
   //wrog
   this.load.spritesheet("enemy", "assets/enemy.png", {
      frameWidth: 45,
      frameHeight: 41,
   });
}

//zmienne
let cursors;
let map1;
let layer1;
let tileset1;
let controls;
let player;
let jump;
let gameoverText;
let winText;
//koniec gry - wartosc pixeli
const END_GAME = 7953;
let reset;
let shot;
let gameInstance;
let scoreText;
let enemiesObjects = [];
let enemies = [];
let bullets;
//tworzenie instancji klasy danych gry
gameInstance = new Game();

function create() {
   map1 = this.make.tilemap({ key: "map1" });
   tileset1 = map1.addTilesetImage("SuperMarioBros-World1-1", "tiles1");

   layer1 = map1.createLayer("World1", tileset1, 0, 0);

   //kolizje na mapie
   map1.setCollision([
      14, 15, 16, 20, 21, 22, 23, 24, 25, 27, 28, 29, 33, 39, 40,
   ]);

   //kolizja z coinem
   map1.setTileIndexCallback(11, getCoin, this);
   //czerwony grzyb
   map1.setTileIndexCallback(12, makeMarioBig, this);

   //zielony grzyb
   map1.setTileIndexCallback(18, addLife, this);
   //gwiazdka
   map1.setTileIndexCallback(19, collectStar, this);

   //odbijanie sie wrogow od scianek
   map1.setTileIndexCallback(16, changeDir, this);
   map1.setTileIndexCallback(27, changeDir, this);
   map1.setTileIndexCallback(28, changeDir, this);

   //skalowanie mapy do wielkosci ekranu
   const SCALE = game.scale.height / layer1.height;
   layer1.setScale(SCALE);

   cursors = this.input.keyboard.createCursorKeys();

   //tworzenie gracza
   player = this.physics.add.sprite(50, 100, "player");
   player.setCollideWorldBounds(true, true, false, false);
   player.setBounce(0.2);
   player.body.gravity.y = 700;

   //wspolrzedne respienia wrogow
   let enemiesX = [
      1000, 1020, 2000, 3000, 4000, 5000, 6000, 7000, 2100, 2200, 2500, 3000,
      4500, 984, 5456, 2056, 7200, 3800, 1250, 6504,
   ];

   //tworzenie wrogow
   for (let i = 0; i < 20; i++) {
      let enemy = this.physics.add.sprite(enemiesX[i], 100, "enemy");
      enemy.body.gravity.y = 500;
      enemy.setScale(0.8);
      enemies.push(enemy);
      enemiesObjects.push(new Enemy());
   }

   //granice kamery
   this.cameras.main.setBounds(
      0,
      0,
      layer1.width * SCALE,
      layer1.height * SCALE
   );
   //granice swiata
   this.physics.world.setBounds(
      0,
      0,
      layer1.width * SCALE,
      layer1.height * SCALE
   );
   //kamera sledzi gracza
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
   this.anims.create({
      key: "enemywalk",
      frames: this.anims.generateFrameNumbers("enemy", { start: 0, end: 1 }),
      frameRate: 10,
      repeat: -1,
   });
   this.anims.create({
      key: "enemydead",
      frames: this.anims.generateFrameNumbers("enemy", { frames: [2] }),
      frameRate: 10,
      repeat: -1,
   });

   //gameover - LOSE
   gameoverText = this.add.text(
      this.physics.world.bounds.centerX,
      250,
      "GAME OVER\nPress enter to reset game",
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
         font: "40px ",
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
      `Score: ${gameInstance.score} \nLifes: ${gameInstance.lifes}\nBullets: ${gameInstance.bullets}`,
      {
         fontSize: "32px",
         fill: "#000",
      }
   );
   //tekst "przyklejony" do kamery
   scoreText.setScrollFactor(0);
   //bindoiwanie klawiszy
   reset = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
   shot = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

   //strzaly -definiowanie
   bullets = this.physics.add.group();

   this.physics.add.collider(bullets, layer1, deleteBullet, null, this);

   enemies.forEach((enemy) => {
      this.physics.add.collider(bullets, enemy, hitEnemy, null, this);
   });
}

//flagi
let isJumping = false;
let shotBlock = false;

function update() {
   //kolizje miedzy playerem a tilesami mapy
   this.physics.collide(player, layer1);

   if (!gameInstance.gameOver && !gameInstance.youWin) {
      if (shot.isDown) {
         //strzelanie
         if (gameInstance.bullets > 0 && !shotBlock) {
            let bullet = bullets.create(player.x, player.y - 15, "ball");
            bullet.setBounce(1);
            bullet.setCollideWorldBounds(true);
            bullet.body.gravity.y = 500;
            gameInstance.bullets--;
            scoreText.setText(
               `Score: ${gameInstance.score} \nLifes: ${gameInstance.lifes}\nBullets: ${gameInstance.bullets}`
            );
            if (player.scaleX === 1) bullet.setVelocityX(500);
            else bullet.setVelocityX(-500);
            shotBlock = true;
            setTimeout(() => {
               //zeby nie strzelac za czesto
               shotBlock = false;
            }, 500);
         }
      }

      enemies.forEach((enemy, idx) => {
         //sprawdzenie kolizji wrogow
         this.physics.collide(enemy, layer1);
         this.physics.collide(player, enemy, (player, enemy) =>
            enemyhit(player, enemy, this)
         );
         try {
            if (enemiesObjects[idx].isAlive && enemy != undefined) {
               if (enemiesObjects[idx].direction) enemy.setVelocityX(-100);
               else enemy.setVelocityX(100);
            } else if (enemy != undefined) enemy.setVelocityX(0);
         } catch {}
      });
      //ruch playera
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
      //smierc przez spadniecie
      if (player.y > game.scale.height - 40) {
         gameInstance.dead();
         this.scene.restart();
      }
      //animacja wrogow
      enemies.forEach((enemy, idx) => {
         try {
            if (enemiesObjects[idx].isAlive)
               enemy.anims.play("enemywalk", true);
            else enemy.anims.play("enemydead", true);
         } catch {}
      });
      //warunek wygrania gry
      if (player.x >= END_GAME) {
         const screenCenterX =
            this.cameras.main.worldView.x + this.cameras.main.width / 2;
         const screenCenterY =
            this.cameras.main.worldView.y + this.cameras.main.height / 2;

         winText.y = screenCenterY;
         winText.x = screenCenterX;
         winText.setText(
            `YOU WIN\nSCORE:${gameInstance.score}\nPress enter to reset game`
         );
         winText.visible = true;
         gameInstance.win();
         this.physics.pause();
      }
   } else if (!gameInstance.youWin) {
      // gdy gra przegrana
      const screenCenterX =
         this.cameras.main.worldView.x + this.cameras.main.width / 2;
      const screenCenterY =
         this.cameras.main.worldView.y + this.cameras.main.height / 2;
      player.disableBody(true, true);
      gameoverText.y = screenCenterY;
      gameoverText.x = screenCenterX;
      gameoverText.visible = true;
      gameOver = true;
      this.physics.pause();
   }
   //resetowanie gry
   if ((gameInstance.gameOver || gameInstance.youWin) && reset.isDown) {
      this.registry.destroy();
      this.events.off();
      this.scene.restart();
      gameInstance = new Game();
   }
}
function getCoin(sprite, coin) {
   //callback lapania coina
   if (sprite === player) {
      layer1.replaceByIndex(11, 1, coin.x, coin.y, 1, 1);
      gameInstance.addScore();
      scoreText.setText(
         `Score: ${gameInstance.score} \nLifes: ${gameInstance.lifes}\nBullets: ${gameInstance.bullets}`
      );
   }
}

function makeMarioBig(sprite, mushroom) {
   //callback czerwonego grzyba
   if (sprite === player) {
      layer1.replaceByIndex(12, 1, mushroom.x, mushroom.y, 1, 1);
      gameInstance.makeMarioBig();
      player.scaleY = 2;
   }
}

function addLife(sprite, mushroom) {
   //callback grzyba zielonego
   if (sprite === player) {
      layer1.replaceByIndex(18, 1, mushroom.x, mushroom.y, 1, 1);
      gameInstance.addLife();
      scoreText.setText(
         `Score: ${gameInstance.score} \nLifes: ${gameInstance.lifes}\nBullets: ${gameInstance.bullets}`
      );
   }
}

function collectStar(sprite, star) {
   //callback zlapania gwiazdki
   if (sprite === player) {
      layer1.replaceByIndex(19, 1, star.x, star.y, 1, 1);
      gameInstance.addBullets(10);
      scoreText.setText(
         `Score: ${gameInstance.score} \nLifes: ${gameInstance.lifes}\nBullets: ${gameInstance.bullets}`
      );
   }
}

function changeDir(sprite, wall) {
   //callback obijania wrogow od scian
   let enemy = enemies.findIndex((e) => e === sprite);
   if (enemy !== -1) enemiesObjects[enemy].changeDirection();
}

let block = false;

function enemyhit(player, enemy, game) {
   //callback zderzenia playera z wrogiem
   if (player.y < enemy.y - 30) {
      //zabicie wroga
      let idx = enemies.findIndex((e) => e === enemy);
      if (idx !== -1) {
         if (enemiesObjects[idx].isAlive) {
            enemiesObjects[idx].dead();
            gameInstance.addScore(10);
            scoreText.setText(
               `Score: ${gameInstance.score} \nLifes: ${gameInstance.lifes}\nBullets: ${gameInstance.bullets}`
            );
         }
      }
   } else {
      //zabicie playera lub pomniejszenie jesli duzy
      let idx = enemies.findIndex((e) => e === enemy);
      if (idx !== -1) {
         if (enemiesObjects[idx].isAlive) {
            if (!block) {
               if (gameInstance.mariobBig) {
                  player.setScale(1);
                  gameInstance.makeMarioSmall();
               } else {
                  gameInstance.dead();
                  game.scene.restart();
               }
               block = true;
               setTimeout(() => {
                  block = false;
               }, 1000);
            }
         }
      }
   }
}

function deleteBullet(bullet, sprite) {
   // znikanie kulek
   bullet.disableBody(true, true);
}

function hitEnemy(enemy, bullet) {
   //callvak zderzenia kuli z wrogiem
   let idx = enemies.findIndex((e) => e === enemy);
   if (idx !== -1) {
      if (enemiesObjects[idx].isAlive) {
         enemiesObjects[idx].dead();
      }
   }
}

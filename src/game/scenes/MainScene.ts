import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, MAP_CONFIGS } from '../config';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { PowerUp, PowerUpType } from '../entities/PowerUp';

interface GameData {
  matchId: string;
  map: string;
  mode: string;
  playerId: string;
  playerData: {
    id: string;
    username: string;
    character: string;
    team?: string;
  };
}

export class MainScene extends Phaser.Scene {
  private players: Map<string, Player> = new Map();
  private projectiles: Projectile[] = [];
  private powerUps: PowerUp[] = [];
  private localPlayer?: Player;
  private platforms?: Phaser.Physics.Arcade.StaticGroup;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private gameData?: GameData;
  private scoreText?: Phaser.GameObjects.Text;
  private hpText?: Phaser.GameObjects.Text;
  private weaponText?: Phaser.GameObjects.Text;
  private lastPowerUpSpawn: number = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: GameData) {
    this.gameData = data;
  }

  preload() {
    this.createPlaceholderAssets();
  }

  create() {
    if (!this.gameData) {
      console.error('No game data provided');
      return;
    }

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e).setOrigin(0, 0);

    this.createMap();
    this.createPlayer();
    this.setupInput();
    this.createHUD();
    this.setupCollisions();

    this.time.addEvent({
      delay: 10000,
      callback: this.spawnPowerUp,
      callbackScope: this,
      loop: true,
    });
  }

  private createPlaceholderAssets() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('player', 32, 32);
    graphics.clear();

    graphics.fillStyle(0xffaa00, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('projectile', 16, 16);
    graphics.clear();

    graphics.fillStyle(0x00ffff, 1);
    graphics.fillRect(0, 0, 24, 24);
    graphics.generateTexture('powerup', 24, 24);
    graphics.clear();

    graphics.destroy();
  }

  private createMap() {
    const mapConfig = MAP_CONFIGS[this.gameData!.map as keyof typeof MAP_CONFIGS] || MAP_CONFIGS.classic_arena;

    this.physics.world.gravity.y = mapConfig.gravity;

    this.platforms = this.physics.add.staticGroup();

    mapConfig.platforms.forEach((platform) => {
      const rect = this.add.rectangle(
        platform.x,
        platform.y,
        platform.width,
        platform.height,
        0x4a5568
      );
      this.physics.add.existing(rect, true);
      this.platforms!.add(rect);
    });
  }

  private createPlayer() {
    const spawnPoints = [
      { x: 200, y: 100 },
      { x: 1080, y: 100 },
      { x: 640, y: 100 },
      { x: 400, y: 100 },
    ];

    const spawn = Phaser.Math.RND.pick(spawnPoints);

    this.localPlayer = new Player(
      this,
      spawn.x,
      spawn.y,
      this.gameData!.playerId,
      this.gameData!.playerData.username,
      this.gameData!.playerData.character as any,
      true,
      this.gameData!.playerData.team
    );

    this.players.set(this.localPlayer.id, this.localPlayer);
  }

  private setupInput() {
    this.cursors = this.input.keyboard?.createCursorKeys();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.localPlayer && this.localPlayer.hp > 0) {
        const shotData = this.localPlayer.shoot(pointer.worldX, pointer.worldY);
        if (shotData) {
          this.createProjectile(
            this.localPlayer.sprite.x,
            this.localPlayer.sprite.y,
            shotData.angle,
            this.localPlayer.id,
            shotData.weapon as any
          );
        }
      }
    });
  }

  private createHUD() {
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(100);

    this.hpText = this.add.text(16, 48, 'HP: 100/100', {
      fontSize: '20px',
      color: '#00ff00',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(100);

    this.weaponText = this.add.text(16, 80, 'Weapon: Pillow Blaster', {
      fontSize: '16px',
      color: '#ffaa00',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(100);

    const controlsText = `Controls: Arrow Keys = Move | Space = Jump | Click = Shoot`;
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, controlsText, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  }

  private setupCollisions() {
    this.players.forEach((player) => {
      this.physics.add.collider(player.sprite, this.platforms!);
    });
  }

  private createProjectile(x: number, y: number, angle: number, ownerId: string, weaponType: any) {
    const projectile = new Projectile(this, x, y, angle, ownerId, weaponType);
    this.projectiles.push(projectile);

    this.physics.add.collider(projectile.sprite, this.platforms!, () => {
      const index = this.projectiles.indexOf(projectile);
      if (index > -1) {
        this.projectiles.splice(index, 1);
        projectile.destroy();
      }
    });

    this.players.forEach((player) => {
      if (player.id !== ownerId) {
        this.physics.add.overlap(projectile.sprite, player.sprite, () => {
          player.takeDamage(projectile.damage, ownerId);

          if (ownerId === this.localPlayer?.id && player.hp <= 0) {
            this.localPlayer.kills++;
            this.updateScore();
          }

          const index = this.projectiles.indexOf(projectile);
          if (index > -1) {
            this.projectiles.splice(index, 1);
            projectile.destroy();
          }
        });
      }
    });
  }

  private spawnPowerUp() {
    if (this.powerUps.length >= 5) return;

    const types: PowerUpType[] = ['HP_BOOST', 'DAMAGE_UP', 'RAPID_FIRE', 'MAGNET_FIELD', 'TELEPORT_CRYSTAL'];
    const type = Phaser.Math.RND.pick(types);

    const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
    const y = Phaser.Math.Between(100, GAME_HEIGHT - 200);

    const powerUp = new PowerUp(this, x, y, type);
    this.powerUps.push(powerUp);

    if (this.localPlayer) {
      this.physics.add.overlap(this.localPlayer.sprite, powerUp.sprite, () => {
        this.collectPowerUp(powerUp);
      });
    }
  }

  private collectPowerUp(powerUp: PowerUp) {
    if (!this.localPlayer) return;

    switch (powerUp.type) {
      case 'HP_BOOST':
        this.localPlayer.heal(50);
        break;
      case 'DAMAGE_UP':
        this.localPlayer.powerUps.add('DAMAGE_UP');
        this.time.delayedCall(10000, () => {
          this.localPlayer?.powerUps.delete('DAMAGE_UP');
        });
        break;
      case 'RAPID_FIRE':
        this.localPlayer.powerUps.add('RAPID_FIRE');
        this.time.delayedCall(8000, () => {
          this.localPlayer?.powerUps.delete('RAPID_FIRE');
        });
        break;
    }

    const index = this.powerUps.indexOf(powerUp);
    if (index > -1) {
      this.powerUps.splice(index, 1);
      powerUp.destroy();
    }
  }

  private updateScore() {
    if (this.localPlayer && this.scoreText) {
      const score = this.localPlayer.kills - this.localPlayer.deaths;
      this.scoreText.setText(`K/D: ${this.localPlayer.kills}/${this.localPlayer.deaths} (${score})`);
    }
  }

  update() {
    if (!this.localPlayer || !this.cursors) return;

    this.players.forEach((player) => player.update());
    this.projectiles.forEach((projectile) => projectile.update());

    if (this.localPlayer.hp > 0) {
      let moveX = 0;
      if (this.cursors.left.isDown) moveX = -1;
      if (this.cursors.right.isDown) moveX = 1;

      this.localPlayer.move(moveX);

      if (Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
        this.localPlayer.jump();
      }
    } else {
      this.localPlayer.sprite.setVelocityX(0);
    }

    if (this.hpText && this.localPlayer) {
      const hpColor = this.localPlayer.hp > 60 ? '#00ff00' : this.localPlayer.hp > 30 ? '#ffaa00' : '#ff0000';
      this.hpText.setText(`HP: ${Math.floor(this.localPlayer.hp)}/${this.localPlayer.maxHp}`);
      this.hpText.setColor(hpColor);
    }

    if (this.weaponText && this.localPlayer) {
      const weaponName = this.localPlayer.currentWeapon.replace(/_/g, ' ');
      this.weaponText.setText(`Weapon: ${weaponName}`);
    }
  }
}

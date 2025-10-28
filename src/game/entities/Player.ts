import Phaser from 'phaser';
import { PLAYER_CONFIG } from '../config';

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  id: string;
  username: string;
  characterType: keyof typeof PLAYER_CONFIG;
  hp: number;
  maxHp: number;
  kills: number = 0;
  deaths: number = 0;
  currentWeapon: string = 'PILLOW_BLASTER';
  lastShotTime: number = 0;
  powerUps: Set<string> = new Set();
  isLocal: boolean;
  team?: string;

  private hpBar: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    username: string,
    characterType: keyof typeof PLAYER_CONFIG,
    isLocal: boolean = false,
    team?: string
  ) {
    this.scene = scene;
    this.id = id;
    this.username = username;
    this.characterType = characterType;
    this.isLocal = isLocal;
    this.team = team;

    const config = PLAYER_CONFIG[characterType];
    this.maxHp = config.hp;
    this.hp = config.hp;

    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setDisplaySize(32 * config.size, 48 * config.size);
    this.sprite.setTint(config.color);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0.1);
    this.sprite.setData('player', this);

    this.hpBar = scene.add.graphics();
    this.nameText = scene.add.text(x, y - 40, username, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);

    this.updateHpBar();
  }

  update() {
    this.hpBar.setPosition(this.sprite.x - 20, this.sprite.y - 30);
    this.nameText.setPosition(this.sprite.x, this.sprite.y - 40);
  }

  move(direction: number) {
    const config = PLAYER_CONFIG[this.characterType];
    this.sprite.setVelocityX(direction * config.speed);

    if (direction !== 0) {
      this.sprite.setFlipX(direction < 0);
    }
  }

  jump() {
    const config = PLAYER_CONFIG[this.characterType];
    if (this.sprite.body && (this.sprite.body as Phaser.Physics.Arcade.Body).touching.down) {
      this.sprite.setVelocityY(config.jumpForce);
    }
  }

  canShoot(): boolean {
    return Date.now() - this.lastShotTime > 300;
  }

  shoot(targetX: number, targetY: number): { angle: number; weapon: string } | null {
    if (!this.canShoot()) return null;

    this.lastShotTime = Date.now();

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      targetX,
      targetY
    );

    return { angle, weapon: this.currentWeapon };
  }

  takeDamage(damage: number, attackerId?: string): boolean {
    this.hp = Math.max(0, this.hp - damage);
    this.updateHpBar();

    if (this.hp <= 0) {
      this.die(attackerId);
      return true;
    }

    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.sprite.setTint(PLAYER_CONFIG[this.characterType].color);
    });

    return false;
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.updateHpBar();
  }

  die(killerId?: string) {
    this.deaths++;

    this.sprite.setTint(0x666666);
    this.sprite.setAlpha(0.5);

    this.scene.time.delayedCall(3000, () => {
      this.respawn();
    });
  }

  respawn() {
    const spawnPoints = [
      { x: 200, y: 100 },
      { x: 1080, y: 100 },
      { x: 640, y: 100 },
      { x: 400, y: 100 },
      { x: 880, y: 100 },
    ];

    const spawn = Phaser.Math.RND.pick(spawnPoints);
    this.sprite.setPosition(spawn.x, spawn.y);
    this.hp = this.maxHp;
    this.sprite.setAlpha(1);
    this.sprite.setTint(PLAYER_CONFIG[this.characterType].color);
    this.updateHpBar();
  }

  private updateHpBar() {
    this.hpBar.clear();

    const barWidth = 40;
    const barHeight = 4;
    const hpPercent = this.hp / this.maxHp;

    this.hpBar.fillStyle(0x000000);
    this.hpBar.fillRect(0, 0, barWidth, barHeight);

    const color = hpPercent > 0.6 ? 0x00ff00 : hpPercent > 0.3 ? 0xffaa00 : 0xff0000;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(0, 0, barWidth * hpPercent, barHeight);
  }

  destroy() {
    this.sprite.destroy();
    this.hpBar.destroy();
    this.nameText.destroy();
  }
}

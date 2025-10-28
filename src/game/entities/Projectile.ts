import Phaser from 'phaser';
import { WEAPON_CONFIG } from '../config';

export class Projectile {
  sprite: Phaser.Physics.Arcade.Sprite;
  ownerId: string;
  weaponType: keyof typeof WEAPON_CONFIG;
  damage: number;
  private scene: Phaser.Scene;
  private maxDistance: number;
  private startX: number;
  private startY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
    ownerId: string,
    weaponType: keyof typeof WEAPON_CONFIG
  ) {
    this.scene = scene;
    this.ownerId = ownerId;
    this.weaponType = weaponType;
    this.startX = x;
    this.startY = y;

    const config = WEAPON_CONFIG[weaponType];
    this.damage = config.damage;
    this.maxDistance = config.range;

    this.sprite = scene.physics.add.sprite(x, y, 'projectile');
    this.sprite.setDisplaySize(12, 12);
    this.sprite.setTint(this.getWeaponColor());

    const speed = 'speed' in config ? config.speed : 400;
    const velocity = scene.physics.velocityFromRotation(angle, speed);
    this.sprite.setVelocity(velocity.x, velocity.y);
    this.sprite.setRotation(angle);
    this.sprite.setData('projectile', this);
  }

  update() {
    const distance = Phaser.Math.Distance.Between(
      this.startX,
      this.startY,
      this.sprite.x,
      this.sprite.y
    );

    if (distance > this.maxDistance) {
      this.destroy();
    }
  }

  private getWeaponColor(): number {
    switch (this.weaponType) {
      case 'PILLOW_BLASTER': return 0xffffff;
      case 'LASER_SHOT': return 0xff0000;
      case 'GRENADE_LAUNCHER': return 0xff8800;
      case 'PLASMA_BALL': return 0x00ffff;
      case 'SNIPER_SHOT': return 0xffff00;
      default: return 0xaaaaaa;
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}

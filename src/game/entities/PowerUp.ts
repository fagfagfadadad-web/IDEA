import Phaser from 'phaser';
import { POWERUP_CONFIG } from '../config';

export type PowerUpType = keyof typeof POWERUP_CONFIG;

export class PowerUp {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: PowerUpType;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    this.scene = scene;
    this.type = type;

    this.sprite = scene.physics.add.sprite(x, y, 'powerup');
    this.sprite.setDisplaySize(24, 24);
    this.sprite.setTint(this.getPowerUpColor());
    this.sprite.setData('powerup', this);

    scene.tweens.add({
      targets: this.sprite,
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  private getPowerUpColor(): number {
    switch (this.type) {
      case 'HP_BOOST': return 0x00ff00;
      case 'DAMAGE_UP': return 0xff0000;
      case 'RAPID_FIRE': return 0xffff00;
      case 'MAGNET_FIELD': return 0xff00ff;
      case 'TELEPORT_CRYSTAL': return 0x00ffff;
      case 'EXPLOSIVE_AURA': return 0xff8800;
      case 'RANDOM_EFFECT': return 0xffffff;
      default: return 0xaaaaaa;
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}

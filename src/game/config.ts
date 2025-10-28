import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { LoadingScene } from './scenes/LoadingScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 600 },
      debug: false,
    },
  },
  scene: [LoadingScene, MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export const PLAYER_CONFIG = {
  SCOUT: {
    speed: 250,
    jumpForce: -500,
    hp: 80,
    size: 0.8,
    color: 0x00ff00,
  },
  TANK: {
    speed: 150,
    jumpForce: -400,
    hp: 150,
    size: 1.2,
    color: 0x0000ff,
  },
  BLASTER: {
    speed: 200,
    jumpForce: -450,
    hp: 100,
    size: 1.0,
    color: 0xff0000,
  },
  TRICKSTER: {
    speed: 220,
    jumpForce: -480,
    hp: 90,
    size: 0.9,
    color: 0xff00ff,
  },
};

export const WEAPON_CONFIG = {
  PILLOW_BLASTER: {
    damage: 15,
    cooldown: 300,
    speed: 400,
    range: 500,
  },
  LASER_SHOT: {
    damage: 35,
    cooldown: 1500,
    speed: 1000,
    range: 800,
  },
  GRENADE_LAUNCHER: {
    damage: 40,
    cooldown: 1000,
    speed: 300,
    range: 600,
    explosionRadius: 100,
  },
  MINE_DROPPER: {
    damage: 50,
    cooldown: 2000,
    range: 0,
    explosionRadius: 120,
  },
  BOOMERANG: {
    damage: 25,
    cooldown: 800,
    speed: 350,
    range: 400,
  },
  SHOCKWAVE_GUN: {
    damage: 30,
    cooldown: 1200,
    range: 150,
    angle: 60,
  },
  SNIPER_SHOT: {
    damage: 80,
    cooldown: 2500,
    speed: 1200,
    range: 1000,
  },
  PLASMA_BALL: {
    damage: 35,
    cooldown: 1000,
    speed: 150,
    range: 700,
    penetrate: true,
  },
  DUAL_BLASTER: {
    damage: 12,
    cooldown: 250,
    speed: 400,
    range: 500,
    shots: 2,
  },
};

export const POWERUP_CONFIG = {
  HP_BOOST: { value: 50, duration: 0 },
  DAMAGE_UP: { multiplier: 1.25, duration: 10000 },
  RAPID_FIRE: { multiplier: 0.5, duration: 8000 },
  MAGNET_FIELD: { radius: 200, duration: 15000 },
  TELEPORT_CRYSTAL: { uses: 1, duration: 0 },
  EXPLOSIVE_AURA: { damage: 20, duration: 12000 },
  RANDOM_EFFECT: { duration: 5000 },
};

export const MAP_CONFIGS = {
  classic_arena: {
    name: 'Classic Arena',
    gravity: 600,
    platforms: [
      { x: 640, y: 680, width: 1280, height: 80 },
      { x: 320, y: 500, width: 200, height: 20 },
      { x: 960, y: 500, width: 200, height: 20 },
      { x: 640, y: 350, width: 300, height: 20 },
    ],
  },
  space_station: {
    name: 'Space Station',
    gravity: 300,
    platforms: [
      { x: 640, y: 680, width: 1280, height: 80 },
      { x: 200, y: 550, width: 150, height: 20 },
      { x: 1080, y: 550, width: 150, height: 20 },
      { x: 640, y: 400, width: 400, height: 20 },
      { x: 400, y: 250, width: 150, height: 20 },
      { x: 880, y: 250, width: 150, height: 20 },
    ],
  },
  jungle_temple: {
    name: 'Jungle Temple',
    gravity: 600,
    platforms: [
      { x: 640, y: 680, width: 1280, height: 80 },
      { x: 150, y: 550, width: 150, height: 20 },
      { x: 450, y: 450, width: 150, height: 20 },
      { x: 830, y: 450, width: 150, height: 20 },
      { x: 1130, y: 550, width: 150, height: 20 },
      { x: 640, y: 300, width: 200, height: 20 },
    ],
  },
  lava_base: {
    name: 'Lava Base',
    gravity: 600,
    platforms: [
      { x: 640, y: 680, width: 1280, height: 80 },
      { x: 300, y: 520, width: 250, height: 20 },
      { x: 980, y: 520, width: 250, height: 20 },
      { x: 640, y: 380, width: 300, height: 20 },
    ],
    hazards: [
      { x: 640, y: 700, width: 400, height: 40, damage: 10 },
    ],
  },
  cyber_grid: {
    name: 'Cyber Grid',
    gravity: 600,
    platforms: [
      { x: 640, y: 680, width: 1280, height: 80 },
      { x: 320, y: 480, width: 200, height: 20 },
      { x: 960, y: 480, width: 200, height: 20 },
      { x: 640, y: 320, width: 250, height: 20 },
    ],
    teleports: [
      { x: 100, y: 600, targetX: 1180, targetY: 600 },
      { x: 1180, y: 600, targetX: 100, targetY: 600 },
    ],
  },
  vertical_tower: {
    name: 'Vertical Tower',
    gravity: 600,
    platforms: [
      { x: 640, y: 680, width: 400, height: 80 },
      { x: 640, y: 540, width: 350, height: 20 },
      { x: 640, y: 400, width: 350, height: 20 },
      { x: 640, y: 260, width: 350, height: 20 },
      { x: 640, y: 120, width: 300, height: 20 },
    ],
  },
  frozen_cave: {
    name: 'Frozen Cave',
    gravity: 600,
    friction: 0.02,
    platforms: [
      { x: 640, y: 680, width: 1280, height: 80 },
      { x: 250, y: 520, width: 200, height: 20 },
      { x: 1030, y: 520, width: 200, height: 20 },
      { x: 640, y: 360, width: 350, height: 20 },
    ],
  },
};

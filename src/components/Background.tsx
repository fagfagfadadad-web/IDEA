import { useEffect, useRef } from 'react';

const colorPalette = ['#7B61FF', '#38BDF8', '#FF6B6B', '#FFD93D', '#6BCB77'];

export const Background = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hexagonGridRef = useRef<HTMLDivElement>(null);
  const fpsMeterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) {
      console.error('Canvas element not found');
      return;
    }
    const ctx = cvs.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not found');
      return;
    }

    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;

    let particlesArray: Particle[] = [];
    let mouse: { x: number | null; y: number | null; radius: number } = { x: null, y: null, radius: 170 };

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      color: string;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update() {
        if (this.x > cvs.width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > cvs.height || this.y < 0) {
          this.directionY = -this.directionY;
        }

        let dx = mouse.x !== null ? mouse.x - this.x : 0;
        let dy = mouse.y !== null ? mouse.y - this.y : 0;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius + this.size) {
          if (mouse.x !== null && mouse.x < this.x && this.x < cvs.width - this.size * 10) {
            this.x += 10;
          }
          if (mouse.x !== null && mouse.x > this.x && this.x > this.size * 10) {
            this.x -= 10;
          }
          if (mouse.y !== null && mouse.y < this.y && this.y < cvs.height - this.size * 10) {
            this.y += 10;
          }
          if (mouse.y !== null && mouse.y > this.y && this.y > this.size * 10) {
            this.y -= 10;
          }
        }
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    function init() {
      particlesArray = [];
      let numberOfParticles = (cvs.height * cvs.width) / 9000;
      for (let i = 0; i < numberOfParticles * 0.25; i++) {
        let size = Math.random() * 35 + 1;
        let x = Math.random() * (innerWidth - size * 2 - size * 2) + size * 2;
        let y = Math.random() * (innerWidth - size * 2 - size * 2) + size * 2;
        let directionX = Math.random() * 2 - 1;
        let directionY = Math.random() * 2 - 1;
        let color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
      }
    }

    function connect() {
      let opacityValue = 1;
      for (let i = 0; i < particlesArray.length; i++) {
        for (let j = i; j < particlesArray.length; j++) {
          let distance =
            (particlesArray[i].x - particlesArray[j].x) * (particlesArray[i].x - particlesArray[j].x) +
            (particlesArray[i].y - particlesArray[j].y) * (particlesArray[i].y - particlesArray[j].y);
          if (distance < (cvs.width / 7) * (cvs.height / 7)) {
            opacityValue = 1 - distance / 20000;
            ctx.strokeStyle = `rgba(${parseInt(particlesArray[i].color.slice(1, 3), 16)}, ${parseInt(
              particlesArray[i].color.slice(3, 5),
              16
            )}, ${parseInt(particlesArray[i].color.slice(5, 7), 16)}, ${opacityValue})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
            ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
            ctx.stroke();
          }
        }
      }
    }

    let animationFrameId: number;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connect();
    }

    function hexagonGrid() {
      const HEXAGON_GRID = hexagonGridRef.current;
      if (!HEXAGON_GRID) return;

      const CONTAINER = HEXAGON_GRID.parentNode as HTMLElement;
      let wall = {
        width: CONTAINER.offsetWidth,
        height: CONTAINER.offsetHeight,
      };

      let rowsNumber = Math.ceil(wall.height / 80);
      let columnsNumber = Math.ceil(wall.width / 100) + 1;

      HEXAGON_GRID.innerHTML = '';

      for (let i = 0; i < rowsNumber; i++) {
        let row = document.createElement('div');
        row.className = 'row';
        HEXAGON_GRID.appendChild(row);
      }

      let rows = HEXAGON_GRID.querySelectorAll('.row');
      for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < columnsNumber; j++) {
          let hexagon = document.createElement('div');
          hexagon.className = 'hexagon';
          hexagon.dataset.x = (j * 100 + (i % 2 === 0 ? 0 : 50)).toString();
          hexagon.dataset.y = (i * 80).toString();
          rows[i].appendChild(hexagon);
        }
      }
    }

    function updateHexagons() {
      const hexagons = document.querySelectorAll('.hexagon') as NodeListOf<HTMLElement>;
      hexagons.forEach((hex) => {
        const hexX = parseFloat(hex.dataset.x!) + 50;
        const hexY = parseFloat(hex.dataset.y!) + 55;
        let distance = mouse.x && mouse.y ? Math.sqrt((mouse.x - hexX) ** 2 + (mouse.y - hexY) ** 2) : Infinity;

        if (distance < mouse.radius) {
          const delay = (distance / mouse.radius) * 300;
          setTimeout(() => {
            const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            hex.style.setProperty('--hover-color', randomColor);
          }, delay);
        } else {
          setTimeout(() => {
            hex.style.setProperty('--hover-color', '#FFFFFF');
          }, 500);
        }
      });
    }

    function initFPSMeter() {
      const fpsMeter = fpsMeterRef.current;
      if (!fpsMeter) return;

      let previousTime = Date.now();
      let frames = 0;
      let refreshRate = 1000;

      requestAnimationFrame(function loop() {
        const TIME = Date.now();
        frames++;
        if (TIME > previousTime + refreshRate) {
          let fps = Math.round((frames * refreshRate) / (TIME - previousTime));
          previousTime = TIME;
          frames = 0;
          fpsMeter.innerHTML = 'FPS: ' + fps * (1000 / refreshRate);
        }
        requestAnimationFrame(loop);
      });
    }

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.x;
      mouse.y = event.y;
      mouse.radius = 170;
      updateHexagons();
    };

    const handleMouseStop = () => {
      mouse.radius = 0;
      updateHexagons();
    };

    let thread: NodeJS.Timeout;
    const handleMouseMoveWithStop = () => {
      clearTimeout(thread);
      thread = setTimeout(handleMouseStop, 10);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.onmousemove = handleMouseMoveWithStop;

    window.addEventListener('resize', () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      mouse.radius = 170;
      init();
      hexagonGrid();
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
      updateHexagons();
    });

    hexagonGrid();
    init();
    animate();
    initFPSMeter();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', () => {});
      window.removeEventListener('mouseout', () => {});
      document.onmousemove = null;
    };
  }, []);

  return (
    <section className="absolute top-0 left-0 w-full h-full">
      <canvas id="particles" ref={canvasRef}></canvas>
      <div id="hexagonGrid" ref={hexagonGridRef}></div>
      <div id="fpsMeter" ref={fpsMeterRef}></div>
    </section>
  );
};

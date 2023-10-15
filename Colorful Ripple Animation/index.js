class Circle {
  constructor(opts) {
    this.x = opts.x;
    this.y = opts.y;
    this.r = opts.r;
    this.fill = opts.fill;
    this.stroke = opts.stroke;
    this.opacity = opts.opacity || 1;
  }

  draw(ctx) {
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    if (this.stroke) {
      ctx.strokeStyle = this.stroke.color;
      ctx.lineWidth = this.stroke.width;
      ctx.stroke();
    }
    if (this.fill) {
      ctx.fillStyle = this.fill;
      ctx.fill();
    }
    ctx.closePath();
    ctx.globalAlpha = 1;
  }
}

class CanvasAnimator {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvasHeight = undefined;
    this.canvasWidth = undefined;
    this.bgColor = "#FF6138";
    this.animations = [];
    this.circles = [];
    this.colorPicker = {
      colors: ["#2e9599", "#f7dc68", "#f46c3f", "#a7226f"],
      index: 0,
      next: function () {
        this.index = this.index++ < this.colors.length - 1 ? this.index : 0;
        return this.colors[this.index];
      },
      current: function () {
        return this.colors[this.index];
      }
    };

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.addEventListeners();
    this.init();
  }

  resizeCanvas() {
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;
    this.canvas.width = this.canvasWidth * devicePixelRatio;
    this.canvas.height = this.canvasHeight * devicePixelRatio;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  addEventListeners() {
    document.addEventListener("touchstart", (e) => this.handleEvent(e));
    document.addEventListener("mousedown", (e) => this.handleEvent(e));
  }

  deleteAnimation(animation) {
    const index = this.animations.indexOf(animation);
    if (index > -1) this.animations.splice(index, 1);
  }

  calculatePageFillRadius(x, y) {
    const l = Math.max(x - 0, this.canvasWidth - x);
    const h = Math.max(y - 0, this.canvasHeight - y);
    return Math.sqrt(Math.pow(l, 2) + Math.pow(h, 2));
  }

  handleEvent(event) {
    if (event.touches) {
      event.preventDefault();
      e = event.touches[0];
    }
    const currentColor = this.colorPicker.current();
    const nextColor = this.colorPicker.next();
    const targetR = this.calculatePageFillRadius(event.pageX, event.pageY);
    const rippleSize = Math.min(200, this.canvasWidth * 0.4);
    const minCoverDuration = 750;

    const pageFill = new Circle({
      x: event.pageX,
      y: event.pageY,
      r: 0,
      fill: nextColor
    });
    const fillAnimation = anime({
      targets: pageFill,
      r: targetR,
      duration: Math.max(targetR / 2, minCoverDuration),
      easing: "easeOutQuart",
      complete: () => {
        this.bgColor = pageFill.fill;
        this.deleteAnimation(fillAnimation);
      }
    });

    const ripple = new Circle({
      x: event.pageX,
      y: event.pageY,
      r: 0,
      fill: currentColor,
      stroke: {
        width: 3,
        color: currentColor
      },
      opacity: 1
    });
    const rippleAnimation = anime({
      targets: ripple,
      r: rippleSize,
      opacity: 0,
      easing: "easeOutExpo",
      duration: 900,
      complete: () => this.deleteAnimation(rippleAnimation)
    });

    const elements = [];
    for (let i = 0; i < 32; i++) {
      const element = new Circle({
        x: event.pageX,
        y: event.pageY,
        fill: currentColor,
        r: anime.random(24, 48)
      });
      elements.push(element);
    }
    const elementsAnimation = anime({
      targets: elements,
      x: (element) => element.x + anime.random(rippleSize, -rippleSize),
      y: (element) => element.y + anime.random(rippleSize * 1.15, -rippleSize * 1.15),
      r: 0,
      easing: "easeOutExpo",
      duration: anime.random(1000, 1300),
      complete: () => this.deleteAnimation(elementsAnimation)
    });
    this.animations.push(fillAnimation, rippleAnimation, elementsAnimation);
  }

  init() {
    if (window.CP) {
      window.CP.PenTimer.MAX_TIME_IN_LOOP_WO_EXIT = 6000;
    }
    if (!!window.location.pathname.match(/fullcpgrid/)) {
      this.startFauxClicking();
    }
    this.handleInactiveUser();
  }

  handleInactiveUser() {
    const inactive = setTimeout(() => {
      this.fauxClick(this.canvasWidth / 2, this.canvasHeight / 2);
    }, 2000);

    function clearInactiveTimeout() {
      clearTimeout(inactive);
      document.removeEventListener("mousedown", clearInactiveTimeout);
      document.removeEventListener("touchstart", clearInactiveTimeout);
    }

    document.addEventListener("mousedown", clearInactiveTimeout);
    document.addEventListener("touchstart", clearInactiveTimeout);
  }

  startFauxClicking() {
    setTimeout(() => {
      this.fauxClick(anime.random(this.canvasWidth * 0.2, this.canvasWidth * 0.8), anime.random(this.canvasHeight * 0.2, this.canvasHeight * 0.8));
      this.startFauxClicking();
    }, anime.random(200, 900));
  }

  fauxClick(x, y) {
    const fauxClick = new Event("mousedown");
    fauxClick.pageX = x;
    fauxClick.pageY = y;
    document.dispatchEvent(fauxClick);
  }

  animate() {
    anime({
      duration: Infinity,
      update: () => {
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.animations.forEach((anim) => {
          anim.animatables.forEach((animatable) => {
            animatable.target.draw(this.ctx);
          });
        });
      }
    });
  }
}

const animator = new CanvasAnimator();
animator.animate();

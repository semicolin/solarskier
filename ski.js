var KEY_LEFT = 37,
    KEY_UP = 38,
    KEY_RIGHT = 39,
    KEY_DOWN = 40,
    KEY_SPACE = 32,
    KEY_ENTER = 13;

var LEFT = -1,
    STRAIGHT = 0,
    RIGHT = 1;

var Game = {
    fps: 60,
    scrollAccelForward: 0.0005,
    scrollAccelReverse: -0.05,
    scrollSpeedMin: -15,
    init: function(canvas) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.keys = {};
        document.onkeydown = this.keydown.bind(this);
        document.onkeyup = this.keyup.bind(this);
        this.resize();
        this.tutorial();
        return this;
    },
    resize: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 5;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    },
    tutorial: function() {
        this.keys = {};
        this.clock = 0;
        this.scrollPos = 0;
        this.scrollSpeed = 0.2;
        this.scrollAccel = 0;
        this.player = Player.init(this.width, this.height);
        this.score = Score.init(this.player, this.width, this.height);
        this.level = TutorialLevel.init(this.player, this.score, this.width, this.height);
        this.timer = setInterval(this.tick.bind(this), 1000 / this.fps);
        this.gameover = false;
        this.tutorial = true;
    },
    start: function() {
        this.keys = {};
        this.clock = 0;
        this.scrollPos = 0;
        this.scrollSpeed = 1;
        this.scrollAccel = this.scrollAccelForward;
        this.player = Player.init(this.width, this.height);
        this.score = Score.init(this.player, this.width, this.height);
        this.level = CircleLevel.init(this.player, this.score, this.width, this.height);
        this.timer = setInterval(this.tick.bind(this), 1000 / this.fps);
        this.gameover = false;
        this.tutorial = false;
    },
    tick: function() {
        // SCROLL SCREEN
        this.clock += 1;
        this.scrollSpeed += this.scrollAccel;
        this.scrollSpeed = Math.max(this.scrollSpeed, this.scrollSpeedMin);
        this.scrollPos -= this.scrollSpeed;
        this.context.setTransform(1,0,0,1,0,-Math.floor(this.scrollPos));
        this.context.clearRect(0, this.scrollPos, this.width, this.height);
        
        // UPDATE
        if (this.tutorial) {
            this.controlTutorial();
        }
        if (!this.gameover) {
            this.level.update(this.scrollPos);
            this.player.update(this.keys);
        }
        
        // CLIP
        this.level.clip(this.scrollPos, this.scrollPos + this.height, this.gameover);
        this.player.clip(this.scrollPos, this.scrollPos + this.height, this.gameover);
        
        // DRAW
        this.level.draw(this.context);
        this.player.draw(this.context);
        if (!this.tutorial) {
            this.context.setTransform(1,0,0,1,0,0);
            this.score.draw(this.context, this.gameover, this.tutorial);
        }
        // CHANGE STATE
        if (this.player.x < 0 || this.player.y < 0 + this.scrollPos || this.player.x > this.width || this.player.y > this.height + this.scrollPos) {
            this.gameover = true;
            this.scrollAccel = this.scrollAccelReverse;
            if (!this.tutorial) {
                this.score.save();
            }
        }
        if (this.scrollPos > 0) {
            // finished reverse scroll
            clearInterval(this.timer);
        }
    },
    keydown: function(e) {
        this.keys[e.which] = true;
        if ((this.gameover || this.tutorial) && (this.keys[KEY_ENTER] || this.keys[KEY_SPACE])) {
            clearInterval(this.timer);
            this.resize();
            this.start();
        }
    },
    keyup: function(e) {
        this.keys[e.which] = false;
    },
    controlTutorial: function() {
        if (this.clock < 60) {
            this.keys[KEY_LEFT] = false;
            this.keys[KEY_RIGHT] = false;
        } else if (this.clock > 270) {
            this.keys[KEY_LEFT] = false;
            this.keys[KEY_RIGHT] = false;
        } else if (this.clock % 60 < 10 || 50 <= this.clock % 60) {
            this.keys[KEY_LEFT] = true;
            this.keys[KEY_RIGHT] = false;
        } else if (20 <= this.clock % 60 && this.clock % 60 < 40) {
            this.keys[KEY_LEFT] = false;
            this.keys[KEY_RIGHT] = true;
        } else {
            this.keys[KEY_LEFT] = false;
            this.keys[KEY_RIGHT] = false;
        }
    }
};
var Score = {
    best: 0,
    init: function(player, width, height) {
        this.player = player;
        this.width = width;
        this.height = height;
        this.points = 0;
        if (document.cookie) {
            this.best = document.cookie.split('=')[1];
        }
        return this;
    },
    draw: function(ctx, gameover, tutorial) {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        
        ctx.fillStyle = color(this.player.hue);
        ctx.font = '32px sans-serif';
        ctx.fillText(this.format(this.points), this.width - 20, 80);
        ctx.font = '16px sans-serif';
        ctx.fillText('current', this.width - 20, 110);
        
        ctx.fillStyle = color(this.player.hueBase - (this.player.hue - this.player.hueBase));
        ctx.font = '32px sans-serif';
        ctx.fillText(this.format(this.best), this.width - 20, 20);
        ctx.font = '16px sans-serif';
        ctx.fillText('best', this.width - 20, 50);
        
        if (gameover) {
            ctx.font = '64px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (this.isHighscore()) {
                ctx.fillStyle = ctx.createLinearGradient(0,this.height/2-32,0,this.height/2+32);
                ctx.fillStyle.addColorStop(0, color(this.player.hueBase - this.player.hueShift));
                ctx.fillStyle.addColorStop(1, color(this.player.hueBase + this.player.hueShift));
                ctx.fillText('New High Score!', this.width/2, this.height/2);
                ctx.fillStyle = ctx.createLinearGradient(0,this.height/2-80-32,0,this.height/2-80+32);
                ctx.fillStyle.addColorStop(0, color(this.player.hueBase + this.player.hueShift));
                ctx.fillStyle.addColorStop(1, color(this.player.hueBase - this.player.hueShift));
                ctx.fillText(this.format(this.points), this.width/2, this.height/2 - 80);
            } else {
                ctx.fillStyle = '#333366';
                ctx.fillText('Game Over', this.width/2, this.height/2);
            }
            ctx.font = '24px sans-serif';
            ctx.fillStyle = 'black';
            ctx.fillText('press ENTER to play again', this.width/2, this.height/2 + 80);
        }
    },
    format: function(pts) {
        var string = '' + pts;
        var result = '';
        for (var i=1; i<=string.length; i++) {
            result = string[string.length-i] + result
            if (i % 3 === 0) {
                result = ' ' + result;
            }
        }
        return result;
    },
    isHighscore: function() {
        return this.points === this.best && this.best > 0;
    },
    save: function() {
        if (this.points > this.best) {
            this.best = this.points;
            var d = new Date();
            d.setTime(d.getTime()+(365*24*60*60*1000));
            document.cookie = 'best=' + this.best + ';expires=' + d.toGMTString();
        }
    }
};
var Player = {
    hueBase: 245,
    hueShift: 55,
    hueStep: 5,
    widthBase: 4,
    widthStep: 0.1,
    speedMin: 1,
    accel: 0.03,
    deccel: 0.0005,
    turnRate: Math.PI/36,
    frictionMax: 200,
    recovery: 12,
    init: function(width, height) {
        this.x = Math.floor(width/3);
        this.y = height - 1;
        this.bearing = -Math.PI/2;
        this.history = [];
        this.historyMin = 0;
        this.historyMax = 0;
        this.width = this.widthBase;
        this.hue = this.hueBase;
        this.speed = 0 //this.speedMin;
        this.friction = 0;
        this.obstructed = false;
        return this;
    },
    update: function(keys) {
        // TURN
        if (keys[KEY_LEFT] && !this.obstructed && this.turning !== RIGHT) {
            this.turning = LEFT;
            this.friction += this.speed;
            this.friction = Math.min(this.friction, this.frictionMax);
            this.speed -= this.friction * this.deccel;
            this.bearing = (this.bearing - this.turnRate) % (2*Math.PI);
            if (this.hue > this.hueBase - this.hueShift) {
                this.hue -= this.hueStep;
            }
        } else if(keys[KEY_RIGHT] && !this.obstructed && this.turning !== LEFT) {
            this.turning = RIGHT;
            this.friction += this.speed;
            this.friction = Math.min(this.friction, this.frictionMax);
            this.speed -= this.friction * this.deccel;
            this.bearing = (this.bearing + this.turnRate) % (2*Math.PI);
            if (this.hue < this.hueBase + this.hueShift) {
                this.hue += this.hueStep;
            }
        } else {
            this.friction -= this.recovery;
            if (this.friction <= 0) {
                this.friction = 0;
                this.turning = STRAIGHT;
            }
            this.speed += this.accel;
            if (this.hue > this.hueBase) {
                this.hue -= this.hueStep;
            } else if (this.hue < this.hueBase) {
                this.hue += this.hueStep;
            }
        }
        this.alpha = 1;
        this.alpha = this.obstructed ? 0.2 : this.alpha;
        this.width = this.widthBase + this.widthStep * this.friction;
        
        // MOVE
        this.speed = Math.max(this.speed, this.speedMin);
        this.x += this.speed * Math.cos(this.bearing);
        this.y += this.speed * Math.sin(this.bearing);
        this.history.push({
            x: this.x,
            y: this.y,
            w: this.width,
            c: color(this.hue, this.alpha)
        });
        this.historyMax += 1;
    },
    clip: function(top, bottom, gameover) {
        while (this.historyMin < this.history.length-1 && this.history[this.historyMin].y > bottom + 20) {
            this.historyMin += 1;
        }
        if (gameover) {
            while (this.historyMax > 0 && this.history[this.historyMax-1].y < top - 20) {
                this.historyMax -= 1;
            }
            this.historyMin = Math.max(0, this.historyMax - (200+bottom-top));
        }
        //console.log('player',this.historyMin, this.historyMax, this.history.length);
    },
    draw: function(ctx) {
        ctx.lineCap = 'round';
        var x = this.history[this.historyMin].x;
        var y = this.history[this.historyMin].y;
        for (var i=this.historyMin+1; i<this.history.length; i++) {
            var h = this.history[i];
            ctx.lineWidth = h.w;
            ctx.strokeStyle = h.c;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(h.x, h.y);
            ctx.stroke();
            x = h.x;
            y = h.y;
        }
    }
};
var TutorialLevel = {
    init: function(player, score, width, height) {
        this.player = player;
        this.score = score;
        this.width = width;
        this.height = height;
        this.styleSlalomLeft = color(this.player.hueBase - this.player.hueShift, 0.8);
        this.styleSlalomRight = color(this.player.hueBase + this.player.hueShift, 0.8);
        this.obstacles = [{
            x: this.width/3 + 10,
            y: this.height - 450,
            r: 27
        },{
            x: this.width/3 - 120,
            y: this.height - 600,
            r: 53
        },{
            x: this.width/3 - 200,
            y: this.height - 380,
            r: 36
        },{
            x: this.width/3 - 330,
            y: this.height - 200,
            r: 63
        },{
            x: this.width/3 - 100,
            y: this.height - 250,
            r: 16
        },{
            x: this.width/3 - 450,
            y: this.height - 700,
            r: 90
        },{
            x: this.width/3 + 670,
            y: this.height - 630,
            r: 99
        },{
            x: this.width/3 + 880,
            y: this.height - 755,
            r: 48
        },{
            x: this.width/3 + 600,
            y: this.height - 1000,
            r: 77
        }];
        return this;
    },
    update: function(top) {
        if (!this.obstacles[0].s && this.player.y <= this.obstacles[0].y + this.obstacles[0].r) {
            this.obstacles[0].s = RIGHT;
            this.score.points += this.obstacles[0].r;
        }
        if (!this.obstacles[1].s && this.player.y <= this.obstacles[1].y + this.obstacles[1].r) {
            this.obstacles[1].s = LEFT;
            this.score.points += this.obstacles[1].r;
        }
    },
    clip: function(top, bottom) {
        this.top = top;
        this.obstacleMin = 0;
        this.obstacleMax = this.obstacles.length;
    },
    draw: function(ctx) {
        CircleLevel.draw.call(this, ctx);
        
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.font = '32px sans-serif';

        if (this.player.y <= this.top) {
            ctx.textAlign = 'left';
            ctx.fillText('stay on screen!', this.width/3 + 60, this.top + 80);
        }
        if (this.player.y <= this.obstacles[0].y + this.obstacles[0].r) {
            /*
            ctx.textAlign = 'left';
            ctx.fillText('score points', this.width/3 + 60, this.height - 450);
            */
            ctx.textAlign = 'right';
            ctx.fillText('score points', this.width/3 - 70, this.height - 500);

        }
        
        if (this.player.y < this.height - 250) {
            ctx.textAlign = 'right';
            ctx.fillText('avoid planets', this.width/3 - 100, this.height - 300);
        }
        ctx.textAlign = 'left';
        ctx.fillText('LEFT + RIGHT  make turns', this.width/3 + 60, this.height - 180);
        
        if (this.top > 0) {
            ctx.textAlign = 'center';
            ctx.fillText('press ENTER to play', this.width/2, this.height/2);
        }
        
    }
}

var CircleLevel = {
    obstacleRateAccel: 0.004,
    radiusMax: 100,
    slalomDist: 50,
    init: function(player, score, width, height) {
        this.player = player;
        this.score = score;
        this.obstacleRate = 64000 / width;
        this.width = width;
        this.height = height;
        this.obstacles = [];
        for (var i=height-300; i>-this.radiusMax; i-=this.obstacleRate) {
            this.addObstacle(i);
        }
        this.obstacleMin = 0;
        this.obstacleMax = this.obstacles.length;
        this.styleSlalomLeft = color(this.player.hueBase - this.player.hueShift, 0.8);
        this.styleSlalomRight = color(this.player.hueBase + this.player.hueShift, 0.8);
        return this;
    },
    update: function(top) {
        this.obstacleRate -= this.obstacleRateAccel;
        while (true) {
            var nextObstacle = this.obstacles[this.obstacles.length-1].y - this.obstacleRate;
            if (nextObstacle < top - this.radiusMax) {
                break;
            } else {
                this.addObstacle(nextObstacle);
                this.obstacleMax += 1;
            }
        }
        var x = this.player.x;
        var y = this.player.y;
        var b = (this.player.bearing + 2*Math.PI);
        this.player.obstructed = false;
        for (var i=this.obstacleMin; i<this.obstacleMax; i++) {
            var o = this.obstacles[i];
            var dx = x - o.x;
            var dy = y - o.y;
            var rs = o.r + this.slalomDist;
            var sumSq = dx*dx + dy*dy;
            if (sumSq < o.r*o.r) { // hit obstacle
                this.player.obstructed = true;
                o.hit = true;
                if (o.s) {
                    this.score.points -= o.r;
                    o.s = false;
                }
            } else if (!o.hit && !o.s && sumSq < rs*rs) { // slalom obstacle
                var a = Math.atan2(o.y - y, o.x - x);
                var diff = (b - a + 2*Math.PI) % (2*Math.PI);
                if (Math.PI/4 < diff && diff < 3*Math.PI/4) {
                    o.s = LEFT;
                    this.score.points += o.r;
                } else if (5*Math.PI/4 < diff && diff < 7*Math.PI/4) {
                    o.s = RIGHT;
                    this.score.points += o.r;
                }
            }
        }
    },
    clip: function(top, bottom, gameover) {
        while (this.obstacles[this.obstacleMin].y > bottom + this.radiusMax) {
            this.obstacleMin += 1;
        }
        if (gameover) {
            while (this.obstacleMin > 0 && this.obstacles[this.obstacleMin-1].y < bottom + this.radiusMax) {
                this.obstacleMin -= 1;
            }
            while (this.obstaclesMax > 0 && this.obstacles[this.obstacleMax-1].y < top - this.radiusMax) {
                this.obstacleMax -= 1;
            }
        }
        //console.log('obstacles',this.obstacleMin, this.obstacleMax, this.obstacles.length);
    },
    draw: function(ctx) {
        for (var i=this.obstacleMin; i<this.obstacleMax; i++) {
            var o = this.obstacles[i];
            if (o.s === LEFT) {
                ctx.fillStyle = this.styleSlalomLeft;
            } else if (o.s === RIGHT) {
                ctx.fillStyle = this.styleSlalomRight;
            } else {
                ctx.fillStyle = 'hsla(245,10%,50%,0.5)';
            }
            ctx.beginPath();
            ctx.arc(o.x,o.y,o.r,0,2*Math.PI);
            ctx.fill();
            if (o.s) {
                ctx.fillStyle = 'white';
                ctx.font = Math.floor(o.r*0.8) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(o.r, o.x, o.y);
            }
        }
    },
    addObstacle: function(y) {
        this.obstacles.push({
            x: Math.floor(Math.random() * this.width),
            y: y,
            r: Math.floor(Math.random()*this.radiusMax)
        });
    }
}
function color(hue, alpha) {
    return 'hsla(' + hue + ',100%,50%,' + (alpha||1) + ')';
}

Game.init(document.getElementById('canvas'));

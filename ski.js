var KEY_LEFT = 37,
    KEY_UP = 38,
    KEY_RIGHT = 39,
    KEY_DOWN = 40,
    KEY_SPACE = 32,
    KEY_ENTER = 13;
var LEFT = -1,
    STRAIGHT = 0,
    RIGHT = 1;
var game = {
    fps: 60,
    scrollAccelForward: 0.0005,
    scrollAccelReverse: -0.05,
    scrollSpeedMin: -12,
    gameOver: false,
    init: function() {
        this.canvas = document.getElementById('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 5;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.scrollSpeed = 1;
        this.scrollAccel = this.scrollAccelForward;
        this.scrollPos = 0;
        this.gameOver = false;
        level.init(this.width, this.height);
        player.init(this.width, this.height);
        score.init();
        this.keys = {};
        document.onkeydown = this.keydown.bind(this);
        document.onkeyup = this.keyup.bind(this);
        this.timer = setInterval(this.tick.bind(this), 1000 / this.fps);
    },
    tick: function() {
        this.scrollSpeed += this.scrollAccel;
        this.scrollSpeed = Math.max(this.scrollSpeed, this.scrollSpeedMin);
        this.scrollPos -= this.scrollSpeed;
        if (this.scrollPos > 0) { // finished reverse scroll
            clearInterval(this.timer);
        }
        this.context.setTransform(1,0,0,1,0,-Math.floor(this.scrollPos));
        this.context.clearRect(0, this.scrollPos, this.width, this.height);
        if (!this.gameOver) {
            level.update(this.scrollPos);
            player.update();
        }
        level.clip(this.scrollPos, this.scrollPos + this.height);
        player.clip(this.scrollPos, this.scrollPos + this.height);
        level.draw(this.context);
        player.draw(this.context);
        this.context.setTransform(1,0,0,1,0,0);
        score.draw(this.context);
        if (this.gameOver) {
            this.drawGameOver();
        }
        if (player.x < 0 || player.y < 0 + this.scrollPos || player.x > this.width || player.y > this.height + this.scrollPos) {
            this.gameOver = true;
            this.scrollAccel = this.scrollAccelReverse;
            score.save();
        }
    },
    drawGameOver: function() {
        this.context.font = '64px sans-serif';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        if (score.points === score.best && score.best > 0) {
            this.context.fillStyle = this.context.createLinearGradient(0,this.height/2-32,0,this.height/2+32);
            this.context.fillStyle.addColorStop(0, color(player.hueBase - player.hueShift));
            this.context.fillStyle.addColorStop(1, color(player.hueBase + player.hueShift));
            this.context.fillText('New High Score!', this.width/2, this.height/2);
            this.context.fillStyle = this.context.createLinearGradient(0,this.height/2-80-32,0,this.height/2-80+32);
            this.context.fillStyle.addColorStop(0, color(player.hueBase + player.hueShift));
            this.context.fillStyle.addColorStop(1, color(player.hueBase - player.hueShift));
            this.context.fillText(score.format(score.points), this.width/2, this.height/2 - 80);
        } else {
            this.context.fillStyle = '#333366';
            this.context.fillText('Game Over', this.width/2, this.height/2);
        }
        this.context.font = '16px sans-serif';
        this.context.fillStyle = '#333366';
        this.context.fillText('press ENTER to restart', this.width/2, this.height/2 + 80);
    },
    keydown: function(e) {
        this.keys[e.which] = true;
        if (this.gameOver && (this.keys[KEY_ENTER] || this.keys[KEY_SPACE])) {
            clearInterval(this.timer);
            this.init();
        }
    },
    keyup: function(e) {
        this.keys[e.which] = false;
    }
};
var score = {
    best: 0,
    init: function() {
        this.points = 0;
        if (document.cookie) {
            this.best = document.cookie.split('=')[1];
        }
    },
    draw: function(ctx) {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        
        ctx.fillStyle = color(player.hue);
        ctx.font = '32px sans-serif';
        ctx.fillText(this.format(this.points), game.width - 20, 80);
        ctx.font = '16px sans-serif';
        ctx.fillText('current', game.width - 20, 110);
        
        ctx.fillStyle = color(player.hueBase - (player.hue - player.hueBase));
        ctx.font = '32px sans-serif';
        ctx.fillText(this.format(this.best), game.width - 20, 20);
        ctx.font = '16px sans-serif';
        ctx.fillText('best', game.width - 20, 50);
    },
    format: function(pts) {
        var string = '' + pts;
        var result = '';
        for (var i=1; i<=string.length; i++) {
            result = string[string.length-i] + result
            if (i%3===0) {
                result = ' ' + result;
            }
        }
        return result;
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
var player = {
    hueBase: 245,
    hueShift: 55,
    hueStep: 5,
    widthBase: 4,
    widthStep: 0.1,
    speedMin: 1,
    accel: 0.04,
    deccel: 0.0005,
    turnRate: Math.PI/36,
    frictionMax: 200,
    recovery: 11,
    init: function(width, height) {
        this.x = Math.floor(width/3);
        this.y = height - 1;
        this.bearing = Math.random() * (Math.PI/3) + (4*Math.PI/3);
        this.history = [];
        this.historyMin = 0;
        this.historyMax = 0;
        this.width = this.widthBase;
        this.hue = this.hueBase;
        this.speed = 0 //this.speedMin;
        this.friction = 0;
        this.obstructed = false;
    },
    update: function(top, bottom) {
        // TURN
        if (game.keys[KEY_LEFT] && !this.obstructed && this.turning !== RIGHT) { // && this.jump <= 0  && this.chargeDir !== RIGHT
            this.turning = LEFT;
            this.friction += this.speed;
            this.friction = Math.min(this.friction, this.frictionMax);
            this.speed -= this.friction * this.deccel;
            this.bearing = (this.bearing - this.turnRate) % (2*Math.PI);
            if (this.hue > this.hueBase - this.hueShift) {
                this.hue -= this.hueStep;
            }
        } else if(game.keys[KEY_RIGHT] && !this.obstructed && this.turning !== LEFT) { // && this.jump <= 0 && this.chargeDir !== LEFT
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
        
        // MOVE
        this.speed = Math.max(this.speed, this.speedMin);
        this.x += this.speed * Math.cos(this.bearing);
        this.y += this.speed * Math.sin(this.bearing);
        
        this.width = this.widthBase + this.widthStep * this.friction;
        
        this.history.push({
            x: this.x,
            y: this.y,
            w: this.width,
            c: color(this.hue, this.alpha)
        });
        this.historyMax += 1;
    },
    clip: function(top, bottom) {
        while (this.historyMin < this.history.length && this.history[this.historyMin].y > bottom + 20) {
            this.historyMin += 1;
        }
        if (game.gameOver) {
            while (this.history[this.historyMax-1].y < top - 20) {
                this.historyMax -= 1;
            }
            this.historyMin = Math.max(0, this.historyMax - 800);
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
var level = {
    obstacleRateAccel: 0.004,
    radiusMax: 100,
    slalomDist: 50,
    init: function(width, height) {
        this.obstacleRate = 64000 / width;
        this.width = width;
        this.height = height;
        this.obstacles = [];
        for (var i=height-300; i>-this.radiusMax; i-=this.obstacleRate) {
            this.addObstacle(i);
        }
        this.obstacleMin = 0;
        this.obstacleMax = this.obstacles.length;
        this.styleSlalomLeft = color(player.hueBase - player.hueShift, 0.8);
        this.styleSlalomRight = color(player.hueBase + player.hueShift, 0.8);
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
        var x = player.x;
        var y = player.y;
        var b = (player.bearing + 2*Math.PI);
        player.obstructed = false;
        for (var i=this.obstacleMin; i<this.obstacleMax; i++) {
            var o = this.obstacles[i];
            var dx = x - o.x;
            var dy = y - o.y;
            var rs = o.r + this.slalomDist;
            var sumSq = dx*dx + dy*dy;
            if (sumSq < o.r*o.r) { // hit obstacle
                player.obstructed = true;
                o.hit = true;
                if (o.s) {
                    score.points -= o.r;
                    o.s = false;
                }
            } else if (!o.hit && !o.s && sumSq < rs*rs) { // slalom obstacle
                var a = Math.atan2(o.y - y, o.x - x);
                var diff = (b - a + 2*Math.PI) % (2*Math.PI);
                if (Math.PI/4 < diff && diff < 3*Math.PI/4) {
                    o.s = LEFT;
                    score.points += o.r;
                } else if (5*Math.PI/4 < diff && diff < 7*Math.PI/4) {
                    o.s = RIGHT;
                    score.points += o.r;
                }
            }
        }
    },
    clip: function(top, bottom) {
        while (this.obstacles[this.obstacleMin].y > bottom + this.radiusMax) {
            this.obstacleMin += 1;
        }
        if (game.gameOver) {
            while (this.obstacleMin > 0 && this.obstacles[this.obstacleMin-1].y < bottom + this.radiusMax) {
                this.obstacleMin -= 1;
            }
            while (this.obstacles[this.obstacleMax-1].y < top - this.radiusMax) {
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

game.init();

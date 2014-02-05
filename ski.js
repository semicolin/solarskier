jQuery(function($) {
    var KEY_LEFT = 37,
        KEY_UP = 38,
        KEY_RIGHT = 39,
        KEY_DOWN = 40,
        KEY_SPACE = 32;
    var LEFT = 1,
        RIGHT = 2;
    var game = {
        fps: 30,
        scrollPos: 0,
        scrollSpeed: 2,
        scrollAccel: 0.001,
        gameOver: false,
        init: function(canvas) {
            this.canvas = canvas;
            this.context = canvas.get(0).getContext('2d');
            this.width = this.canvas.width();
            this.height = this.canvas.height();
            this.keys = {};
            $(document).on('keydown', this.keydown.bind(this));
            $(document).on('keyup', this.keyup.bind(this));
            level.init(this.width, this.height);
            this.gameOver = false;
            setInterval(this.tick.bind(this), 1000 / this.fps);
        },
        tick: function() {
            if (this.gameOver) {
                if (this.scrollPos > 0) {
                    this.scrollPos += this.scrollSpeed;
                    this.context.setTransform(1,0,0,1,0,this.scrollPos);
                }
                this.context.clearRect(0, -this.scrollPos, this.width, this.height);
                level.draw(this.context, this.scrollPos);
                player.draw(this.context, this.scrollPos);
                score.draw(this.context, this.scrollPos);
                this.context.fillStyle = color(300);
                this.context.font = '64px sans-serif';
                this.context.textAlign = 'center';
                this.context.textBaseline = 'middle';
                this.context.fillText('Game Over!', this.width/2, this.height/2 - this.scrollPos);
            } else {
                this.scrollSpeed += this.scrollAccel;
                this.scrollPos += this.scrollSpeed;
                this.context.setTransform(1,0,0,1,0,this.scrollPos);
                this.context.clearRect(0, -this.scrollPos, this.width, this.height);
                //this.context.translate(0, this.scrollSpeed);
                /*
                if (player.y < 100 - this.scrollPos) {
                    this.scrollSpeed = -player.speed * Math.sin(player.bearing);
                } */
                level.update(this.scrollPos);
                player.update();
                score.update();
                level.draw(this.context, this.scrollPos);
                player.draw(this.context, this.scrollPos);
                score.draw(this.context, this.scrollPos);
                if (player.x < 0 || player.y < 0 - this.scrollPos || player.x > this.width || player.y > this.height - this.scrollPos) {
                    this.scrollSpeed = -3;
                    //level.firstObstacle = 0;
                    this.gameOver = true;
                }
            }
        },
        keydown: function(e) {
            this.keys[e.which] = true;
        },
        keyup: function(e) {
            this.keys[e.which] = false;
        }
    };
    var score = {
        dist: 0,
        update: function() {
            this.dist += player.speed;
        },
        draw: function(ctx, pos) {
            ctx.fillStyle = color(300);
            ctx.font = '32px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(Math.floor(this.dist), 20, 20 - pos);
            
            ctx.fillStyle = color(180);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(player.history.length, game.width - 20, 20 - pos);
        }
    };
    var player = {
        bearing: -Math.PI/2,
        x: 400,
        y: 800,
        hue: 240,
        hueBase: 240,
        hueMax: 300,
        hueMin: 180,
        hueStep: 5,
        width: 5,
        widthBase: 5,
        widthStep: 3,
        widthMin: 3,
        charge: 0,
        chargeDir: null,
        chargeMax: 10,
        chargeSpeed: 0.2,
        chargeSpeedTurn: 0.1,
        jump: 0,
        jumpSpeed: 1,
        speed: 3,
        accel: 0.08,
        deccel: 0.05,
        speedMin: 3,
        turnRate: Math.PI/20,
        turnDur: 0,
        historyMax: 100,
        history: [],
        update: function() {
            var turning;
            var charging = game.keys[KEY_SPACE];
            var obstacle = level.isObstacle(this.x, this.y);
            
            // TURN
            if (game.keys[KEY_LEFT] && this.chargeDir !== 'right' && !obstacle) { // && this.jump <= 0
                turning = 'left';
                this.turnDur += 1;
                //this.speed -= this.deccel;
                this.speed -= this.turnDur * this.turnDur * 0.0005;
                this.bearing -= this.turnRate;
                if (this.hue > this.hueMin) {
                    this.hue -= this.hueStep;
                }
            } else if(game.keys[KEY_RIGHT] && this.chargeDir !== 'left' && !obstacle) { // && this.jump <= 0
                turning = 'right';
                this.turnDur += 1;
                //this.speed -= this.deccel;
                this.speed -= this.turnDur * this.turnDur * 0.0005;
                this.bearing += this.turnRate;
                if (this.hue < this.hueMax) {
                    this.hue += this.hueStep;
                }
            } else {
                turning = false;
                this.turnDur = 0;
                if (this.jump <= 0) {
                    this.speed += this.accel;
                }
                if (this.hue > this.hueBase) {
                    this.hue -= this.hueStep;
                } else if (this.hue < this.hueBase) {
                    this.hue += this.hueStep;
                }
            }
            
            // CHARGE
            if((charging || turning) && this.jump <= 0 && this.charge < this.chargeMax) {
                if (charging) {
                    this.charge += this.chargeSpeed;
                    this.jump -= this.chargeSpeed;
                }
                if (turning) {
                    if (!this.chargeDir) {
                        this.chargeDir = turning;
                    }
                    if (this.chargeDir === turning) {
                        this.charge += this.chargeSpeedTurn * this.speed/3;
                        this.jump -= this.chargeSpeedTurn * this.speed/3;
                    }
                }
            // JUMP
            } else if (this.charge > 0) {
                this.jump += this.jumpSpeed;
                if (this.jump > 0) {
                    this.charge -= this.jumpSpeed;
                }
            // FALL
            } else if (this.jump > 0) {
                this.chargeDir = null;
                this.jump -= this.jumpSpeed;
                if (this.jump < 0) {
                    this.jump = 0;
                }
                this.charge = 0;
            }
            this.width = this.widthBase - this.widthStep * this.jump;
            if (this.width < this.widthMin) { this.width = this.widthMin; }
            
            /*
            this.alpha = 1 - this.jump * 0.2;
            if (this.alpha < 0.1) { this.alpha = 0.1; }
            */
            
            // MOVE
            if (this.speed < this.speedMin) {
                this.speed = this.speedMin;
            }
            this.x += this.speed * Math.cos(this.bearing);
            this.y += this.speed * Math.sin(this.bearing);
            
            this.alpha = 1;
            if (obstacle) { this.alpha = 0.1; }

            this.history.push({
                x: this.x,
                y: this.y,
                w: this.width,
                c: color(this.hue, this.alpha)
            });
            /*
            if (this.history.length > this.historyMax) {
                this.history.shift();
            }*/
            console.log('charge: ' + this.charge + '   jump: ' + this.jump + '   dir: ' + this.chargeDir + '  hist: ' + this.history.length);
        },
        draw: function(ctx) {
            ctx.lineWidth = this.width;
            ctx.strokeStyle = color(this.hue, this.alpha);
            ctx.lineCap = 'round';
            var h0 = 0; // Math.max(0, this.history.length - this.historyMax);
            var x = this.history[h0].x;
            var y = this.history[h0].y;
            for (var i=h0+1; i<this.history.length; i++) {
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
        obstacleRate: 20,
        obstacleRateAccel: 0.002,
        radiusMax: 80,
        init: function(width, height) {
            this.width = width;
            this.height= height;
            this.obstacles = [];
            for (var i=this.height+this.radiusMax; i>-this.radiusMax; i-=this.obstacleRate) {
                this.addObstacle(i);
            }
            this.firstObstacle = 0;
        },
        update: function(pos) {
            //console.log('pos: ' + pos + '   obs: ' + this.obstacles[this.obstacles.length-1].y);
            this.obstacleRate -= this.obstacleRateAccel;
            while (true) {
                var nextObstacle = this.obstacles[this.obstacles.length-1].y - this.obstacleRate;
                if (nextObstacle < -pos-this.radiusMax) { break; }
                this.addObstacle(nextObstacle);
            }
            /*
            if (pos % 12 === 0) {
                // this.obstacles.shift();
                this.firstObstacle += 1;
                this.addObstacle(-pos-100);
            } */
        },
        draw: function(ctx) {
            ctx.fillStyle = 'hsla(240,10%,50%,0.5)';
            //for (var i=this.firstObstacle; i<this.obstacles.length; i++) {
            for (var i=0; i<this.obstacles.length; i++) {
                var o = this.obstacles[i];
                ctx.beginPath();
                ctx.arc(o.x,o.y,o.r,0,2*Math.PI);
                ctx.fill();
            }
        },
        addObstacle: function(y) {
            this.obstacles.push({
                x: Math.floor(Math.random() * this.width),
                y: y,
                r: Math.random()*this.radiusMax
            });
        },
        isObstacle: function(x,y) {
            //for (var i=this.firstObstacle; i<this.obstacles.length; i++) {
            for (var i=0; i<this.obstacles.length; i++) {
                var o = this.obstacles[i];
                var dx = x - o.x;
                var dy = y - o.y;
                if (dx*dx + dy*dy < o.r*o.r) {
                    return true;
                }
            }
            return false;
        }
    }
    function color(hue, alpha) {
        return 'hsla(' + hue + ',100%,50%,' + (alpha||1) + ')';
    }
    
    game.init($('#canvas'));
});
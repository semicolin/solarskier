(function() {
var KEY_LEFT = 37,
    KEY_UP = 38,
    KEY_RIGHT = 39,
    KEY_DOWN = 40,
    KEY_SPACE = 32,
    KEY_ENTER = 13,
    LEFT = -1,
    STRAIGHT = 0,
    RIGHT = 1,
    HUE_BASE = 245,
    HUE_SHIFT = 55;
var color = function (hue, alpha) {
    return 'hsla(' + hue + ',100%,50%,' + alpha + ')';
};
var Game = (function() {
    var fps = 60;
    var scrollAccelForward = 0.0005;
    var scrollAccelReverse = -0.05;
    var scrollSpeedMin = -15;
    var canvas, context, timer, keys, width, height, clock, scrollPos, scrollSpeed, scrollAccel, gameover, tutorial;
    var player, score, level;
    var init = function(c) {
        canvas = c;
        context = canvas.getContext('2d');
        keys = {};
        document.onkeydown = keydown;
        document.onkeyup = keyup;
        resize();
        if (Score.loadHighscore()) {
            start();
        } else {
            startTutorial();
        }
    };
    var resize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 5;
        width = canvas.width;
        height = canvas.height;
    };
    var startTutorial = function() {
        keys = {};
        clock = 0;
        scrollPos = 0;
        scrollSpeed = 0.2;
        scrollAccel = 0;
        player = Player.init(width, height);
        score = Score.init(player, width, height);
        level = Level.Tutorial.init(player, score, width, height);
        timer = setInterval(tick, 1000 / fps);
        gameover = false;
        tutorial = true;
    };
    var start = function() {
        keys = {};
        clock = 0;
        scrollPos = 0;
        scrollSpeed = 1;
        scrollAccel = scrollAccelForward;
        player = Player.init(width, height);
        score = Score.init(player, width, height);
        level = Level.Planets.init(player, score, width, height);
        timer = setInterval(tick.bind(this), 1000 / fps);
        gameover = false;
        tutorial = false;
    };
    var tick = function() {
        // SCROLL SCREEN
        clock += 1;
        scrollSpeed += scrollAccel;
        scrollSpeed = Math.max(scrollSpeed, scrollSpeedMin);
        scrollPos -= scrollSpeed;
        context.setTransform(1,0,0,1,0,-Math.floor(scrollPos));
        context.clearRect(0, scrollPos, width, height);
        
        // UPDATE
        if (tutorial) {
            controlTutorial();
        }
        if (!gameover) {
            level.update(scrollPos);
            if (!player.update(keys, scrollPos)) {
                gameover = true;
                scrollAccel = scrollAccelReverse;
                if (!tutorial) {
                    score.saveHighscore();
                }
            }
        }
        
        // CLIP
        level.clip(scrollPos, scrollPos + height, gameover);
        player.clip(scrollPos, scrollPos + height, gameover);
        
        // DRAW
        level.draw(context);
        player.draw(context, scrollPos + height);
        if (!tutorial) {
            context.setTransform(1,0,0,1,0,0);
            score.draw(context, gameover);
        }
        if (scrollPos > 0) {
            // finished reverse scroll
            clearInterval(timer);
        }
    };
    var keydown = function(e) {
        keys[e.which] = true;
        if ((gameover || tutorial) && (keys[KEY_ENTER] || keys[KEY_SPACE])) {
            clearInterval(timer);
            resize();
            start();
        }
    };
    var keyup = function(e) {
        keys[e.which] = false;
    };
    var controlTutorial = function() {
        if (clock < 60) {
            keys[KEY_LEFT] = false;
            keys[KEY_RIGHT] = false;
        } else if (clock > 270) {
            keys[KEY_LEFT] = false;
            keys[KEY_RIGHT] = false;
        } else if (clock % 60 < 10 || 50 <= clock % 60) {
            keys[KEY_LEFT] = true;
            keys[KEY_RIGHT] = false;
        } else if (20 <= clock % 60 && clock % 60 < 40) {
            keys[KEY_LEFT] = false;
            keys[KEY_RIGHT] = true;
        } else {
            keys[KEY_LEFT] = false;
            keys[KEY_RIGHT] = false;
        }
    };
    return {
        init: init
    };
}());
var Score = (function() {
    var best = 0;
    var width, height, points;
    var player;
    var init = function(p, w, h) {
        player = p;
        width = w;
        height = h;
        points = 0;
        loadHighscore();
        return this;
    };
    var draw = function(ctx, gameover) {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        
        ctx.fillStyle = color(player.getHue(), 1);
        ctx.font = '32px sans-serif';
        ctx.fillText(format(points), width - 20, 80);
        ctx.font = '16px sans-serif';
        ctx.fillText('current', width - 20, 110);
        
        ctx.fillStyle = color(HUE_BASE - (player.getHue() - HUE_BASE), 1);
        ctx.font = '32px sans-serif';
        ctx.fillText(format(best), width - 20, 20);
        ctx.font = '16px sans-serif';
        ctx.fillText('best', width - 20, 50);
        
        if (gameover) {
            ctx.font = '64px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (isHighscore()) {
                ctx.fillStyle = ctx.createLinearGradient(0,height/2-32,0,height/2+32);
                ctx.fillStyle.addColorStop(0, color(HUE_BASE - HUE_SHIFT, 1));
                ctx.fillStyle.addColorStop(1, color(HUE_BASE + HUE_SHIFT, 1));
                ctx.fillText('New High Score!', width/2, height/2);
                ctx.fillStyle = ctx.createLinearGradient(0,height/2-80-32,0,height/2-80+32);
                ctx.fillStyle.addColorStop(0, color(HUE_BASE + HUE_SHIFT, 1));
                ctx.fillStyle.addColorStop(1, color(HUE_BASE - HUE_SHIFT, 1));
                ctx.fillText(format(points), width/2, height/2 - 80);
            } else {
                ctx.fillStyle = '#333366';
                ctx.fillText('Game Over', width/2, height/2);
            }
            ctx.font = '24px sans-serif';
            ctx.fillStyle = 'black';
            ctx.fillText('press ENTER to play again', width/2, height/2 + 80);
        }
    };
    var format = function(pts) {
        var string = pts.toString();
        var result = '';
        for (var i=1; i<=string.length; i++) {
            result = string[string.length-i] + result
            if (i % 3 === 0) {
                result = ' ' + result;
            }
        }
        return result;
    };
    var isHighscore = function() {
        return points === best && best > 0;
    };
    var saveHighscore = function() {
        if (points > best) {
            best = points;
            var d = new Date();
            d.setTime(d.getTime()+(365*24*60*60*1000));
            document.cookie = 'solarskierhighscore=' + best + ';expires=' + d.toGMTString();
        }
    };
    var loadHighscore = function() {
        if (document.cookie) {
            var cookies = document.cookie.split(';');
            for (var i=0; i<cookies.length; i++) {
                var parts = cookies[i].split('=');
                if (parts[0] === 'solarskierhighscore') {
                    best = parts[1];
                    return true;
                }
            }
        }
        return false;
    };
    var addPoints = function(pts) {
        points += pts;
    };
    var removePoints = function(pts) {
        points -= pts;
    };
    return {
        init: init,
        draw: draw,
        saveHighscore: saveHighscore,
        loadHighscore: loadHighscore,
        addPoints: addPoints,
        removePoints: removePoints
    };
}());
var Player = (function() {
    var hueStep = 5;
    var sizeBase = 4;
    var sizeStep = 0.1;
    var speedMin = 1;
    var accel = 0.03;
    var deccel = 0.0005;
    var turnRate = Math.PI/36;
    var frictionMax = 200;
    var recovery = 12;
    var width, height, x, y, bearing, turning, history, historyMin, historyMax, size, hue, speed, friction, obstructed;
    var init = function(w, h) {
        width = w;
        height = h;
        x = Math.floor(w/3);
        y = h - 1;
        bearing = -Math.PI/2;
        turning = STRAIGHT;
        history = [];
        historyMin = 0;
        historyMax = 0;
        size = sizeBase;
        hue = HUE_BASE;
        speed = 0 //speedMin;
        friction = 0;
        obstructed = false;
        return this;
    };
    var update = function(keys, top) {
        // TURN
        if (keys[KEY_LEFT] && !obstructed && turning !== RIGHT) {
            turning = LEFT;
            friction += speed;
            friction = Math.min(friction, frictionMax);
            speed -= friction * deccel;
            bearing = (bearing - turnRate) % (2*Math.PI);
            if (hue > HUE_BASE - HUE_SHIFT) {
                hue -= hueStep;
            }
        } else if(keys[KEY_RIGHT] && !obstructed && turning !== LEFT) {
            turning = RIGHT;
            friction += speed;
            friction = Math.min(friction, frictionMax);
            speed -= friction * deccel;
            bearing = (bearing + turnRate) % (2*Math.PI);
            if (hue < HUE_BASE + HUE_SHIFT) {
                hue += hueStep;
            }
        } else {
            friction -= recovery;
            if (friction <= 0) {
                friction = 0;
                turning = STRAIGHT;
            }
            speed += accel;
            if (hue > HUE_BASE) {
                hue -= hueStep;
            } else if (hue < HUE_BASE) {
                hue += hueStep;
            }
        }
        alpha = 1;
        alpha = obstructed ? 0.2 : alpha;
        size = sizeBase + sizeStep * friction;
        
        // MOVE
        speed = Math.max(speed, speedMin);
        x += speed * Math.cos(bearing);
        y += speed * Math.sin(bearing);
        history.push({
            x: x,
            y: y,
            size: size,
            color: color(hue, alpha)
        });
        historyMax += 1;
        
        // DIE
        if (x < 0 || y < top || x > width || y > height + top) {
            return false;
        }
        return true;   
    };
    var clip = function(top, bottom, gameover) {
        if (gameover) {
            while (historyMax > 0 && history[historyMax-1].y < top - 20) {
                historyMax -= 1;
            }
            historyMin = Math.max(0, historyMax - (200+bottom-top));
        } else {
            while (historyMin < history.length-1 && history[historyMin].y > bottom + 20) {
                historyMin += 1;
            }
        }
    };
    var draw = function(ctx, bottom) {
        ctx.lineCap = 'round';
        var x0 = history[historyMin].x;
        var y0 = history[historyMin].y;
        var h;
        for (var i=historyMin+1; i<historyMax; i++) {
            h = history[i];
            if (h.y < bottom) {
                ctx.lineWidth = h.size;
                ctx.strokeStyle = h.color;
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(h.x, h.y);
                ctx.stroke();
            }
            x0 = h.x;
            y0 = h.y;
        }
    };
    return {
        init: init,
        update: update,
        clip: clip,
        draw: draw,
        setObstructed: function(o) { obstructed = o; },
        getHue: function() { return hue; },
        getX: function() { return x; },
        getY: function() { return y; },
        getBearing: function() { return bearing; }
    };
}());
var Level = (function() {
    var styleSlalomLeft = color(HUE_BASE - HUE_SHIFT, 0.8);
    var styleSlalomRight = color(HUE_BASE + HUE_SHIFT, 0.8);
    var width, height, obstacles, obstacleMin, obstacleMax;
    var player, score;
    var Tutorial = (function() {
        var top;
        var init = function(p, s, w, h) {
            player = p;
            score = s;
            width = w;
            height = h;
            obstacles = [{
                x: width/3 + 10,
                y: height - 450,
                r: 27
            },{
                x: width/3 - 120,
                y: height - 600,
                r: 53
            },{
                x: width/3 - 200,
                y: height - 380,
                r: 36
            },{
                x: width/3 - 330,
                y: height - 200,
                r: 63
            },{
                x: width/3 - 100,
                y: height - 250,
                r: 16
            },{
                x: width/3 - 450,
                y: height - 700,
                r: 90
            },{
                x: width/3 + 670,
                y: height - 630,
                r: 99
            },{
                x: width/3 + 880,
                y: height - 755,
                r: 48
            },{
                x: width/3 + 600,
                y: height - 1000,
                r: 77
            }];
            return this;
        };
        var update = function(top) {
            if (!obstacles[0].slalom && player.getY() <= obstacles[0].y + obstacles[0].r) {
                obstacles[0].slalom = RIGHT;
            }
            if (!obstacles[1].slalom && player.getY() <= obstacles[1].y + obstacles[1].r) {
                obstacles[1].slalom = LEFT;
            }
        };
        var clip = function(pos) {
            top = pos;
            obstacleMin = 0;
            obstacleMax = obstacles.length;
        };
        var draw = function(ctx) {
            Planets.draw(ctx);
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'black';
            ctx.font = '32px sans-serif';
            if (player.getY() <= top) {
                ctx.textAlign = 'left';
                ctx.fillText('stay on screen!', width/3 + 60, top + 80);
            }
            if (player.getY() <= obstacles[0].y + obstacles[0].r) {
                ctx.textAlign = 'right';
                ctx.fillText('score points', width/3 - 70, height - 500);
            }
            if (player.getY() < height - 250) {
                ctx.textAlign = 'right';
                ctx.fillText('avoid planets', width/3 - 100, height - 300);
            }
            ctx.textAlign = 'left';
            ctx.fillText('LEFT + RIGHT  make turns', width/3 + 60, height - 180);
            if (top > 0) {
                ctx.textAlign = 'center';
                ctx.fillText('press ENTER to play', width/2, height/2);
            }
        };
        return {
            init: init,
            update: update,
            clip: clip,
            draw: draw
        };
    }());
    var Planets = (function() {
        var obstacleRateAccel = 0.003;
        var radiusMin = 10;
        var radiusMax = 100;
        var slalomDist = 50;
        var obstacleRate;
        var init = function(p, s, w, h) {
            player = p;
            score = s;
            width = w;
            height = h;
            obstacleRate = 64000 / width;
            obstacles = [];
            for (var i=height-300; i>-radiusMax; i-=obstacleRate) {
                addObstacle(i);
            }
            obstacleMin = 0;
            obstacleMax = obstacles.length;
            return this;
        };
        var update = function(top) {
            obstacleRate -= obstacleRateAccel;
            while (true) {
                var nextObstacle = obstacles[obstacles.length-1].y - obstacleRate;
                if (nextObstacle < top - radiusMax) {
                    break;
                } else {
                    addObstacle(nextObstacle);
                    obstacleMax += 1;
                }
            }
            var x = player.getX();
            var y = player.getY();
            var b = (player.getBearing() + 2*Math.PI);
            player.setObstructed(false);
            for (var i=obstacleMin; i<obstacleMax; i++) {
                var o = obstacles[i];
                var dx = x - o.x;
                var dy = y - o.y;
                var rs = o.r + slalomDist;
                var sumSq = dx*dx + dy*dy;
                if (sumSq < o.r*o.r) { // hit obstacle
                    player.setObstructed(true);
                    o.hit = true;
                    if (o.slalom) {
                        score.removePoints(o.r);
                        o.slalom = false;
                    }
                } else if (!o.hit && !o.slalom && sumSq < rs*rs) { // slalom obstacle
                    var a = Math.atan2(o.y - y, o.x - x);
                    var diff = (b - a + 2*Math.PI) % (2*Math.PI);
                    if (Math.PI/4 < diff && diff < 3*Math.PI/4) {
                        o.slalom = LEFT;
                        score.addPoints(o.r);
                    } else if (5*Math.PI/4 < diff && diff < 7*Math.PI/4) {
                        o.slalom = RIGHT;
                        score.addPoints(o.r);
                    }
                }
            }
        };
        var clip = function(top, bottom, gameover) {
            if (gameover) {
                while (obstacleMin > 0 && obstacles[obstacleMin-1].y < bottom + radiusMax) {
                    obstacleMin -= 1;
                }
                while (obstacleMax > 0 && obstacles[obstacleMax-1].y < top - radiusMax) {
                    obstacleMax -= 1;
                }
            } else {
                while (obstacles[obstacleMin].y > bottom + radiusMax) {
                    obstacleMin += 1;
                }
            }
        };
        var draw = function(ctx) {
            var o;
            for (var i=obstacleMin; i<obstacleMax; i++) {
                o = obstacles[i];
                if (o.slalom === LEFT) {
                    ctx.fillStyle = styleSlalomLeft;
                } else if (o.slalom === RIGHT) {
                    ctx.fillStyle = styleSlalomRight;
                } else {
                    ctx.fillStyle = 'hsla(245,10%,50%,0.5)';
                }
                ctx.beginPath();
                ctx.arc(o.x,o.y,o.r,0,2*Math.PI);
                ctx.fill();
                if (o.slalom) {
                    ctx.fillStyle = 'white';
                    ctx.font = Math.floor(o.r*0.8) + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(o.r, o.x, o.y);
                }
            }
        };
        var addObstacle = function(y) {
            obstacles.push({
                x: Math.floor(Math.random() * width),
                y: y,
                r: Math.floor(Math.random() * (radiusMax - radiusMin) + radiusMin)
            });
        };
        return {
            init: init,
            update: update,
            clip: clip,
            draw: draw
        };
    })();
    return {
        Tutorial: Tutorial,
        Planets: Planets
    };
})();
Game.init(document.getElementById('canvas'));
}());
/* solarskier.com
*/
(function() {
WebFontConfig = {
    google: { families: [ 'Sonsie+One::latin', 'Cinzel+Decorative:400:latin', 'Tauri::latin', 'Alegreya+Sans+SC:400:latin' ] },
    active: function() {
        Game.init(document.getElementById('game'));
    }
};
(function() {
    var wf = document.createElement('script');
    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})();
var KEY_LEFT = 37,
    KEY_UP = 38,
    KEY_RIGHT = 39,
    KEY_DOWN = 40,
    KEY_SPACE = 32,
    KEY_ENTER = 13,
    KEY_I = 73,
    LEFT = -1,
    STRAIGHT = 0,
    RIGHT = 1,
    HUE_BASE = 245,
    HUE_SHIFT = 55,
    FONT_TITLE = 'Cinzel Decorative',
    FONT_TEXT = 'Alegreya Sans SC',
    FONT_NUMBER = 'sans-serif';

var Music = (function() {
    // NOTES
    var A5 = new Audio("sfx/5A.ogg"),
        Ab5= new Audio("sfx/5Ab.ogg"),
        G5 = new Audio("sfx/5G.ogg"),
        Gb5= new Audio("sfx/5Gb.ogg"),
        F5 = new Audio("sfx/5F.ogg"),
        E5 = new Audio("sfx/5E.ogg"),
        Eb5= new Audio("sfx/5Eb.ogg"),
        D5 = new Audio("sfx/5D.ogg"),
        Db5= new Audio("sfx/5Db.ogg"),
        C5 = new Audio("sfx/5C.ogg"),
        B4 = new Audio("sfx/4B.ogg"),
        Bb4= new Audio("sfx/4Bb.ogg"),
        A4 = new Audio("sfx/4A.ogg"),
        Ab4= new Audio("sfx/4Ab.ogg"),
        G4 = new Audio("sfx/4G.ogg"),
        Gb4= new Audio("sfx/4Gb.ogg"),
        F4 = new Audio("sfx/4F.ogg"),
        E4 = new Audio("sfx/4E.ogg"),
        Eb4= new Audio("sfx/4Eb.ogg"),
        D4 = new Audio("sfx/4D.ogg"),
        Db4= new Audio("sfx/4Db.ogg"),
        C4 = new Audio("sfx/4C.ogg"),
        B3 = new Audio("sfx/3B.ogg"),
        Bb3= new Audio("sfx/3Bb.ogg"),
        A3 = new Audio("sfx/3A.ogg");
    // CHORDS (arrange notes high-to-low)
    var C = [G5,E5,C5,G4,E4,C4],
        F = [A5,F5,C5,A4,F4,C4],
        G = [G5,D5,B4,G4,D4,B3],
        Am= [E5,C5,A4,E4,C4,A3],
        Em= [G4,E5,B4,G4,E4,B3];
    // TUNE (chords to play and number of notes per chord)
    var progression = [C,G,C,F,G,Am,G];
    var timing =      [8,8,4,8,4,8 ,8];
    var index, counter;
    var init = function() {
        index = 0;
        counter = 0;
        return this;
    };
    var playNote = function(size) {
        counter += 1;
        if (counter > timing[index]) {
            counter = 0;
            index = (index + 1 ) % progression.length;
        }
        var chord = progression[index];
        var note = Math.floor(chord.length * size / 100);
        var sound = chord[note];
        sound.currentTime = 0;
        sound.play();
    };
    return {
        init: init,
        playNote: playNote
    };
}());
var color = function (hue, alpha) {
    return 'hsla(' + hue + ',100%,50%,' + alpha + ')';
};
var Game = (function() {
    var fps = 60;
    var scrollAccelForward = 0.0005;
    var scrollAccelReverse = -0.05;
    var scrollAccelMinForward = -0.025;
    var scrollSpeedMinForward = 0;
    var scrollSpeedMinReverse = -15;
    var canvas, context, timer, keys, width, height, clock, scrollPos, scrollSpeed, scrollSpeedMin, scrollAccel, intro, gameover, tutorial;
    var player, score, level, music;
    var init = function(c) {
        canvas = c;
        context = canvas.getContext('2d');
        keys = {};
        document.onkeydown = keydown;
        document.onkeyup = keyup;
        canvas.addEventListener('touchstart', touchstart);
        canvas.addEventListener('touchend', touchend);
        resize();
        setTimeout(startIntro,100);
        /*
        if (Score.loadHighscore()) {
            start();
        } else {
            startTutorial();
        }*/
    };
    var resize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 5;
        width = canvas.width;
        height = canvas.height;
    };
    var startIntro = function() {
        var fontSizeTitle = Math.floor(width/10);
        var fontSizeText = Math.floor(width/40);
        context.font = fontSizeTitle + 'px ' + FONT_TITLE;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = context.createLinearGradient(0, height/2 - fontSizeTitle/2, 0, height/2 + fontSizeTitle/2);
        context.fillStyle.addColorStop(0, color(HUE_BASE - HUE_SHIFT, 1));
        context.fillStyle.addColorStop(1, color(HUE_BASE + HUE_SHIFT, 1));
        context.fillText('Solar Skier', width/2, height/2);
        context.font = fontSizeText + 'px ' + FONT_TEXT;
        context.fillStyle = 'black';
        context.fillText('press ENTER to play', width/2, height/2 + fontSizeTitle);
        context.font = fontSizeText + 'px ' + FONT_TEXT;
        context.fillStyle = 'black';
        context.fillText('press I for instructions', width/2, height/2 + fontSizeTitle + fontSizeText*1.5);
        
        context.fillStyle = 'hsla(245,10%,50%,0.5)';
        context.beginPath();
        context.arc(width * 0.677, height/2 - fontSizeTitle * 0.8, fontSizeTitle/5, 0, 2*Math.PI);
        context.fill();
        intro = true;
    };
    var startTutorial = function() {
        keys = {};
        clock = 0;
        scrollPos = 0;
        scrollSpeed = 0;
        scrollSpeedMin = 0;
        scrollAccel = 0;
        player = Player.init(width, height);
        score = Score.init(player, width, height);
        level = Level.Tutorial.init(player, score, width, height);
        timer = setInterval(tick, 1000 / fps);
        intro = false;
        gameover = false;
        tutorial = true;
    };
    var start = function() {
        keys = {};
        clock = 0;
        scrollPos = 0;
        scrollSpeed = 0;
        scrollSpeedMin = scrollSpeedMinForward;
        scrollAccel = 0;
        music = Music.init();
        player = Player.init(width, height);
        score = Score.init(player, music, width, height);
        level = Level.Planets.init(player, score, width, height);
        timer = setInterval(tick.bind(this), 1000 / fps);
        intro = false;
        gameover = false;
        tutorial = false;
    };
    var tick = function() {
        // SCROLL SCREEN
        clock += 1;
        if (!gameover && !tutorial) {
            var playerSpeedY = player.getSpeed() * -1 * Math.sin(player.getBearing());
            var pct = 1 - ((player.getY() - scrollPos) / height);
            pct = Math.max(0, pct * 3 - 1);
            scrollAccel = Math.max(scrollAccelMinForward, (playerSpeedY * pct) - scrollSpeed);
            scrollSpeedMin += scrollAccelForward;
        }
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
                scrollSpeedMin = scrollSpeedMinReverse;
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
        if (intro) {
            if (keys[KEY_ENTER]) {
                resize();
                start();
            }
            if (keys[KEY_I]) {
                resize();
                startTutorial();
            }
        }
        if ((gameover || tutorial) && (keys[KEY_ENTER] || keys[KEY_SPACE])) {
            clearInterval(timer);
            resize();
            start();
        }
    };
    var keyup = function(e) {
        keys[e.which] = false;
    };
    var touchstart = function(e) {
        e.preventDefault();
        if (intro || gameover || tutorial) {
            resize();
            start();
        } else {
            var touchX = parseInt(e.changedTouches[0].clientX);
            if (touchX < width/2) {
                keys[KEY_LEFT] = true;
            } else {
                keys[KEY_RIGHT] = true;
            }
        }
    };
    var touchend = function(e) {
        e.preventDefault();
        keys[KEY_LEFT] = false;
        keys[KEY_RIGHT] = false;
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
    var width, height, points, fade;
    var player, music;
    var init = function(p, m, w, h) {
        player = p;
        music = m;
        width = w;
        height = h;
        fade = 0;
        points = 0;
        loadHighscore();
        return this;
    };
    var draw = function(ctx, gameover) {
        if (gameover) {
            if (fade < 0.7) {
                fade += .005;
            }
            ctx.fillStyle = 'hsla(0,0%,100%,' + fade + ')';
            ctx.fillRect(0, 0, width, height);
        }
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        ctx.fillStyle = color(player.getHue(), 1);
        ctx.font = '32px ' + FONT_NUMBER;
        ctx.fillText(Math.floor(10 * player.getSpeed()), 20, 20);
        ctx.font = '16px ' + FONT_TEXT;
        ctx.fillText('speed', 20, 50);
        
        ctx.fillStyle = color(HUE_BASE - (player.getHue() - HUE_BASE), 1);
        ctx.font = '32px ' + FONT_NUMBER;
        ctx.fillText(Math.floor(10 * player.getAvgSpeed()), 20, 80);
        ctx.font = '16px ' + FONT_TEXT;
        ctx.fillText('avg', 20, 110);

        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        
        ctx.fillStyle = color(HUE_BASE - (player.getHue() - HUE_BASE), 1);
        ctx.font = '32px ' + FONT_NUMBER;
        ctx.fillText(format(best), width - 20, 20);
        ctx.font = '16px ' + FONT_TEXT;
        ctx.fillText('best', width - 20, 50);

        ctx.fillStyle = color(player.getHue(), 1);
        ctx.font = '32px ' + FONT_NUMBER;
        ctx.fillText(format(points), width - 20, 80);
        ctx.font = '16px ' + FONT_TEXT;
        ctx.fillText('score', width - 20, 110);
        
        if (gameover) {
            var fontSizeTitle = Math.floor(width/15);
            var fontSizeText = Math.floor(width/40);
            ctx.font = fontSizeTitle + 'px ' + FONT_TEXT;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (isHighscore()) {
                ctx.fillStyle = ctx.createLinearGradient(0, height/2 - fontSizeTitle/2, 0, height/2 + fontSizeTitle/2);
                ctx.fillStyle.addColorStop(0, color(HUE_BASE - HUE_SHIFT, 1));
                ctx.fillStyle.addColorStop(1, color(HUE_BASE + HUE_SHIFT, 1));
                ctx.fillText('New High Score!', width/2, height/2);
                ctx.fillStyle = ctx.createLinearGradient(0, height/2 - fontSizeTitle - fontSizeTitle/2, 0, height/2 - fontSizeTitle + fontSizeTitle/2);
                ctx.fillStyle.addColorStop(0, color(HUE_BASE + HUE_SHIFT, 1));
                ctx.fillStyle.addColorStop(1, color(HUE_BASE - HUE_SHIFT, 1));
                ctx.font = fontSizeTitle + 'px ' + FONT_NUMBER;
                ctx.fillText(format(points), width/2, height/2 - fontSizeTitle);
            } else {
                ctx.fillStyle = 'black';
                ctx.fillText('Game Over', width/2, height/2);
            }
            ctx.font = fontSizeText + 'px ' + FONT_TEXT;
            ctx.fillStyle = 'black';
            ctx.fillText('press ENTER to play again', width/2, height/2 + fontSizeTitle);
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
        music.playNote(pts);
        /*
        var i = Math.floor(sounds.length * pts / 100);
        sounds[i].currentTime = 0;
        sounds[i].play();
        */
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
    var sizeStep = 0.12;
    var speedMin = 1;
    var accel = 0.02;
    var deccel = 0.0004;
    var turnRate = Math.PI/36;
    var frictionMax = 200;
    var recovery = 15;
    var width, height, x, y, bearing, turning, history, historyMin, historyMax, size, hue, speed, speedAvg, friction, obstructed;
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
        speed = speedMin;
        speedAvg = 0;
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
        var weight = 1 / (history.length||1);
        speedAvg = speed * weight + speedAvg * (1 - weight);
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
        if (obstructed || x < 0 || y < top || x > width || y > height + top) {
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
        getBearing: function() { return bearing; },
        getSpeed: function() { return speed; },
        getAvgSpeed: function() { return speedAvg; }
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
            var y = player.getY();
            Planets.draw(ctx);
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'black';
            ctx.font = '32px ' + FONT_TEXT;
            if (y <= top) {
                ctx.textAlign = 'left';
                ctx.fillText('stay on screen!', width/3 + 60, top + 80);
            }
            if (y <= obstacles[0].y + obstacles[0].r) {
                ctx.textAlign = 'right';
                ctx.fillText('score points', width/3 - 70, height - 500);
            }
            if (y < height - 250) {
                ctx.textAlign = 'right';
                ctx.fillText('avoid planets', width/3 - 100, height - 300);
            }
            ctx.textAlign = 'left';
            ctx.fillText('LEFT + RIGHT  make turns', width/3 + 60, height - 180);
            if (top > 0) {
                ctx.font = '32px ' + FONT_TEXT;
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.fillText('press ENTER to play', width/2, height/2);
            }
            
            var fontSize = width/10;
            ctx.font =  fontSize + 'px ' + FONT_TITLE;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = ctx.createLinearGradient(0, height/2 - fontSize/2, 0, height/2 + fontSize/2);
            ctx.fillStyle.addColorStop(0, color(HUE_BASE - HUE_SHIFT, 1));
            ctx.fillStyle.addColorStop(1, color(HUE_BASE + HUE_SHIFT, 1));
            ctx.fillText('Solar Skier', width/2, y - height/2);

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
        var radiusMaxCommon = 81;
        var radiusRareChance = 0.10;
        var slalomDist = 100;
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
                    ctx.font = Math.floor(o.r*0.8) + 'px ' + FONT_NUMBER;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(o.r, o.x, o.y);
                }
            }
        };
        var addObstacle = function(y) {
            var rMax = radiusMaxCommon;
            if (Math.random() < radiusRareChance) {
                rMax = radiusMax;
            }
            obstacles.push({
                x: Math.floor(Math.random() * width),
                y: y,
                r: Math.floor(Math.random() * (rMax - radiusMin) + radiusMin)
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

}());
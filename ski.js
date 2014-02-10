/*  SOLAR SKIER
 *  Version 1.2
 *  Copyright Colin Stynes 2014
 *  solarskier.com
 */
var Ski = function() {
var KEY_LEFT = 37,
    KEY_RIGHT = 39,
    KEY_ENTER = 13,
    KEY_S = 83,
    KEY_T = 84,
    LEFT = -1,
    STRAIGHT = 0,
    RIGHT = 1,
    HUE_BASE = 245,
    HUE_SHIFT = 55,
    FONT_TITLE = 'Cinzel Decorative',
    FONT_TEXT = 'Alegreya Sans SC',
    FONT_NUMBER = 'sans-serif';
var color = function (hue, alpha) {
    return 'hsla(' + hue + ',100%,50%,' + alpha + ')';
};
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
    var E = [Ab5,E5,B4,Ab4,E4,B3],
        A = [A5,E5,Db5,A4,E4,Db4],
        D = [A5,Gb5,D5,A4,Gb4,D4],
        G = [G5,D5,B4,G4,D4,B3],
        C = [G5,E5,C5,G4,E4,C4],
        F = [A5,F5,C5,A4,F4,C4],
        Bb= [F5,D5,Bb4,F4,D4,Bb3],
        Eb= [G5,Eb5,Bb4,G4,Eb4,Bb3],
        Ab= [Ab5,Eb5,C5,Ab4,Eb4,C4],
        Db= [Ab5,F5,Db5,Ab4,F4,Db4],
        Gb= [Gb5,Db5,Bb4,Gb4,Db4,Bb3],
        Am= [E5,C5,A4,E4,C4,A3],
        Em= [G4,E5,B4,G4,E4,B3],
        Dm= [A5,F5,D5,A4,F4,D4];
    // TUNE (chords to play and number of notes per chord)
    var tunes = [{
        name: 'First Song',
        progression: [C,G,C,F,G,Am,G],
        timing:      [8,8,4,8,4,8 ,8]
    },{
        name: 'Rising Fifths',
        progression: [E,A,D,G,C,F,Bb,Eb,Ab,Db,Gb],
        timing:      [6,6,6,6,6,6, 6, 6, 6, 6, 6]
    },{
        name: 'Minor Setback',
        progression: [Am,Dm,Am,Em,Am],
        timing:      [8, 8, 8, 4, 4 ]
    }];
    var displayTime = 120;
    var enabled = true;
    var tune = 0;
    var tune, index, counter, displayFade;
    var init = function() {
        index = 0;
        counter = 0;
        return this;
    };
    var playNote = function(size) {
        counter += 1;
        if (counter > tunes[tune].timing[index]) {
            counter = 0;
            index = (index + 1) % tunes[tune].progression.length;
        }
        if (enabled) {
            var chord = tunes[tune].progression[index];
            var note = Math.floor(chord.length * size / 100);
            var sound = chord[note];
            sound.currentTime = 0;
            sound.play();
        }
    };
    toggle = function() {
        enabled = !enabled;
    };
    changeTune = function() {
        tune = (tune + 1) % tunes.length;
        index = 0;
        counter = 0;
        displayFade = displayTime;
    };
    draw = function(ctx, width, height) {
        if (displayFade > 0) {
            displayFade -= 1;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = 'gray';
            ctx.font = Math.floor(width/40) + 'px ' + FONT_TEXT;
            ctx.fillText(tunes[tune].name, width/2, height-10);
        }
    };
    return {
        init: init,
        playNote: playNote,
        toggle: toggle,
        changeTune: changeTune,
        draw: draw
    };
})();
var Game = (function() {
    var fps = 60;
    var scrollAccelForward = 0.0005;
    var scrollAccelReverse = -0.05;
    var scrollAccelMinForward = -0.025;
    var scrollSpeedMinForward = 0;
    var scrollSpeedMinReverse = -15;
    var canvas, context, timer, keys, width, height, clock, scrollPos, scrollSpeed, scrollSpeedMin, scrollAccel, intro, gameover;
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
        startIntro();
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
        context.fillText('left + right to turn', width/2, height/2 + fontSizeTitle * 0.75);
        context.fillText('press enter to begin', width/2, height/2 + fontSizeTitle * 0.75 + fontSizeText);
        // Dot the "i"
        context.fillStyle = 'hsla(245,10%,50%,0.5)';
        context.beginPath();
        context.arc(width * 0.677, height/2 - fontSizeTitle * 0.8, fontSizeTitle/5, 0, 2*Math.PI);
        context.fill();
        // Sound options
        context.textBaseline = 'bottom';
        context.fillStyle = 'gray';
        context.font = fontSizeText + 'px ' + FONT_TEXT;
        context.textAlign = 'left';
        context.fillText('t: change tune', 10, height-10-fontSizeText);
        context.fillText('s: mute sound', 10, height-10);
        intro = true;
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
    };
    var tick = function() {
        // SCROLL SCREEN
        clock += 1;
        if (!gameover) {
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
        if (!gameover) {
            level.update(scrollPos);
            if (!player.update(keys, scrollPos)) {
                gameover = true;
                scrollAccel = scrollAccelReverse;
                scrollSpeedMin = scrollSpeedMinReverse;
                score.saveHighscore();
            }
        }
        
        // CLIP
        level.clip(scrollPos, scrollPos + height, gameover);
        player.clip(scrollPos, scrollPos + height, gameover);
        
        // DRAW
        level.draw(context);
        player.draw(context, scrollPos + height);
        context.setTransform(1,0,0,1,0,0);
        music.draw(context, width, height);
        score.draw(context, gameover);
        if (scrollPos > 0) {
            // finished gameover reverse scroll
            clearInterval(timer);
        }
    };
    var keydown = function(e) {
        keys[e.which] = true;
        if ((intro || gameover) && keys[KEY_ENTER]) {
            clearInterval(timer);
            resize();
            start();
        }
        if (keys[KEY_S]) {
            music.toggle();
        }
        if (keys[KEY_T]) {
            music.changeTune();
        }
    };
    var keyup = function(e) {
        keys[e.which] = false;
    };
    var touchstart = function(e) {
        e.preventDefault();
        if (intro || gameover) {
            resize();
            start();
        } else {
            var touchX = parseInt(e.changedTouches[0].clientX, 10);
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
    return {
        init: init
    };
})();
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
        var fontSizeText = Math.max(16, Math.floor(width/80));
        var fontSizeNumber = Math.max(32, Math.floor(width/40));
        if (gameover) {
            if (fade < 0.7) {
                fade += .005;
            }
            ctx.fillStyle = 'hsla(0,0%,100%,' + fade + ')';
            ctx.fillRect(0, 0, width, height);
        }
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        var y = 20;
        ctx.fillStyle = color(player.getHue(), 1);
        ctx.font = fontSizeNumber + 'px ' + FONT_NUMBER;
        ctx.fillText(Math.floor(10 * player.getSpeed()), 20, y);
        y += fontSizeNumber * 0.9;
        ctx.font = fontSizeText + 'px ' + FONT_TEXT;
        ctx.fillText('speed', 20, y);
        
        y += fontSizeText + fontSizeNumber * 0.2;
        ctx.fillStyle = color(HUE_BASE - (player.getHue() - HUE_BASE), 1);
        ctx.font = fontSizeNumber + 'px ' + FONT_NUMBER;
        ctx.fillText(Math.floor(10 * player.getAvgSpeed()), 20, y);
        y += fontSizeNumber * 0.9;
        ctx.font = fontSizeText + 'px ' + FONT_TEXT;
        ctx.fillText('avg', 20, y);

        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        
        var y = 20;
        ctx.fillStyle = color(HUE_BASE - (player.getHue() - HUE_BASE), 1);
        ctx.font = fontSizeNumber + 'px ' + FONT_NUMBER;
        ctx.fillText(format(best), width - 20, y);
        y += fontSizeNumber * 0.9;
        ctx.font = fontSizeText + 'px ' + FONT_TEXT;
        ctx.fillText('best', width - 20, y);

        y += fontSizeText + fontSizeNumber * 0.2;
        ctx.fillStyle = color(player.getHue(), 1);
        ctx.font = fontSizeNumber + 'px ' + FONT_NUMBER;
        ctx.fillText(format(points), width - 20, y);
        y += fontSizeNumber * 0.9;
        ctx.font = fontSizeText + 'px ' + FONT_TEXT;
        ctx.fillText('score', width - 20, y);
        
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
            ctx.fillText('press enter to play again', width/2, height/2 + fontSizeTitle);
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
})();
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
            color: color(hue, 1)
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
})();
var Level = (function() {
    var styleSlalomLeft = color(HUE_BASE - HUE_SHIFT, 0.8);
    var styleSlalomRight = color(HUE_BASE + HUE_SHIFT, 0.8);
    var width, height, obstacles, obstacleMin, obstacleMax;
    var player, score;
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
        Planets: Planets
    };
})();
Game.init(document.getElementById('game'));
};
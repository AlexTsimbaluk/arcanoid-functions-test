$(document).ready(function() {

    $.fx.speeds._default = 500;

	var scores = 0,
        lifes = 5,
        area = $(".area"),
        cloud = $(".cloud"),
        block,
        blocks = [],
        blocksInLine = 20,
        linesInCloud,
        ball = $(".ball"),
        board = $(".board"),
        lifesContent = $(".lifes"),
        lifesArray = [],
        lifeDelete,
        glove = $(".glove"),        // расширить доску
        rocket = $(".rocket"),      // увеличить пробиваемость шара
        bomb = $(".bomb"),          // бомба - потеря жизни
                                    // часы - замедлить/увеличить скорость шара 
                                    // несколько шариков
        subjectArray = [glove, rocket, bomb],             // массив предметов                                    

		areaWidth = parseInt(area.css("width")) - parseInt(area.css("borderLeftWidth")) * 2,
		areaHeight = parseInt(area.css("height")) - parseInt(area.css("borderLeftWidth")) * 2,
        cloudHeight,
        blockHeight, 
        ballRadius = parseInt(ball.css("width")),
        boardWidth = parseInt(board.css("width")),
        boardHeight = parseInt(board.css("height")),
        subjectX,
        subjectY,
		start = $(".start-game"),
		stop = $(".stop-game"),
        refresh = $(".refresh"),
        gameOver = $(".game-over");
        stats = $(".stats"),
		coords = $(".coords"),
		data = $(".data");

	var ballMovingTimer,
        boardMoving,
        ballX,
        ballY,
        ballCenterX,
		ballCenterY,
        random,
		speedX,
        speedY,
        boardX,
        boardY,
        boardStep,
		movingFlag,
		animateSpeed = 15,
        intervalSpeed = 1000 / 60;
		// intervalSpeed = 20;
    
    function randNumber(max, min) {
        return Math.round(Math.random() * max) + min;
    }

    makeCloud(80, 20);
    

    function makeCloud(totalBlocks, blocksInLine) {
        var linesInCloud = Math.ceil(totalBlocks / blocksInLine);
        for(var i = 0; i < totalBlocks; i++) {
            var ob = {
                name: "block" + i,
                w: areaWidth / blocksInLine,
                h: 30,
                bg: "#f0f",
                html: "<div class='block' id='block" + i + "'>",
                bgRand: function() {
                    var r = randNumber(255, 0);
                    var g = randNumber(200, 0);
                    var b = randNumber(255, 0);
                    var a = Math.random();
                    // var bgc = "rgba(" + r + "," + g + "," + b + "," + a + ")";
                    var bgc = "rgb(" + r + "," + g + "," + b + ")";
                    return bgc;
                },
                coordLeft: function() {
                    var left;
                    if(this.w * i < areaWidth) {
                        left =  this.w * i;
                    } else if(this.w * i < areaWidth * 2) {
                        left =  this.w * i - areaWidth;
                    } else if(this.w * i < areaWidth * 3) {
                        left =  this.w * i - areaWidth * 2;
                    } else if(this.w * i < areaWidth * 4) {
                        left =  this.w * i - areaWidth * 3;
                    } else {
                        left =  this.w * i - areaWidth * 4;
                    }
                    return left;
                },
                coordTop: function() {
                    var top;
                    if(i < 20) {
                        top =  0;
                    } else if(i < 40) {
                        top = this.h;
                    } else if(i < 60) {
                        top = this.h * 2;
                    } else if(i < 80) {
                        top = this.h * 3;
                    } else {
                        top = this.h * 4;
                    }
                    return top;
                }
            }

            cloud.append(ob.html);
            blocks.push($("#block" + i));
            var blockBg = ob.bgRand();
            var blockLeft = ob.coordLeft();
            var blockTop = ob.coordTop();
            blocks[i].css({
                backgroundColor: blockBg,
                width: ob.w  + "px",
                height: ob.h + "px",
                left: blockLeft + "px",
                top: blockTop + "px"
            });
            blockHeight = parseInt(blocks[i].css("height"));
            blockWidth = parseInt(blocks[i].css("width"));
            blockLeft = parseInt(blocks[i].css("left"));
            blockTop = parseInt(blocks[i].css("top"));
            /*console.log(blockHeight);
            console.log(blockWidth);
            console.log(blockLeft);
            console.log(blockTop);*/
        }
        cloudHeight = linesInCloud * ob.h;
        ball.css({"top": cloudHeight + "px"});
    }


    // Начало игры
    start.click(function() {
        startGame();
        start.hide();
        stop.fadeIn(200);
        setInterval(function() {
            setTimeout(function() {
                // throwSubject(subjectArray[randNumber(subjectArray.length - 1, 0)]);
                throwSubject();
            }, randNumber(5, 1) * 1000);
        }, 5000);
    });
    // Пауза
    stop.click(function() {
        clearInterval(ballMovingTimer);
        // ball.css({ 'background': '#000' });
        start.fadeIn(200);
        stop.hide();
        // ball.css({"left": "0px"});
        // ball.css({"top": "0px"});
    });
    refresh.click(function() {
        location.reload();
    });

    // Начало движения мяча
    function startGame() {
        ball.css({"left": "0px"});
        ball.css({"top": cloudHeight + "px"});
        ball.fadeIn(100);
        ball.transition({ opacity: 1, scale: 1 });
        speedX = randNumber(5, 3);
        speedY = randNumber(5, 3);
        // speedX = 1;
        // speedY = 3;
        ballMovingTimer = setInterval(function() {
            movingBall(speedX, speedY);
        }, intervalSpeed);
    }

    // Получение координат доски, проверка на выход за границы поля, вывод статистики
    (function getCoordBoard() {
        setInterval(function() {
            boardX = parseInt(board.css("left"));
            boardY = parseInt(board.css("top"));
            data.text("Board.X: " + boardX + ", Board.Y: " + boardY);
            if (boardX <= 0) {
                board.css({"left": "0px"});
            }
            if (boardX >= areaWidth - boardWidth) {
                board.css({"left": areaWidth - boardWidth + "px"});
            }
            stats.html("SCORES: " + scores + "<br>LIFES: ");
        }, intervalSpeed);
    })();

    // Управление доской стрелками
    addEventListener("keydown", function(event) {
        if (event.which == 37 && boardX > 0) {
            // board.animate({ "left": "-=20px" }, animateSpeed);
            board.css({ "left": "-=10px" });
        }
        if (event.which == 39 && boardX < areaWidth - boardWidth) {
            // board.animate({ "left": "+=20px" }, animateSpeed);
            board.css({ "left": "+=10px" });
        }
    });

    function reRunTimer(speedX, speedY, horizontalFlag, verticalFlag) {
        clearInterval(ballMovingTimer);
        if(verticalFlag && !horizontalFlag) {
            /*if (Math.round(Math.random() * 100) < 50) {
                speedY = Math.round(speedX * 1.3);
                speedX = randNumber(8, 4);
            }*/
            speedY *= -1;
            speedX = speedX;
        } else if(horizontalFlag && !verticalFlag) {
            /*if (Math.round(Math.random() * 100) < 50) {
                speedY = randNumber(7, 3);
                speedX = Math.round(speedY * 1.3);
            }*/
            speedX *= -1;
            speedY = speedY;
        }
        /*if (Math.round(Math.random() * 100) < 50) {
            speedX = randNumber(8, 4);
            speedY = randNumber(7, 3);
        }*/
        ballMovingTimer = setInterval(function() {
            movingBall(speedX, speedY);
        }, intervalSpeed);
    }

    // Полоса жизней из яблок
    for(var i = 0; i < lifes; i++) {
        lifesContent.append("<span class='life' id='life" + i + "'>");
        lifesArray.push($("#life" + i));
    }

    function catchSubject(subject) {
        var boardAddWidth =  boardWidth / 4;
        var result = "";

        if(subject.attr("class") == "glove") {
            board.css("width", "+=" + boardAddWidth);
            setTimeout(function() {
                board.css("width", "-=" + boardAddWidth);
            }, 15000);
            result = "glove";
            // console.log(subject);
        } else if(subject.attr("class") == "rocket") {
            console.log(999999999999999);
            result = "rocket";
        } else if(subject.attr("class") == "bomb") {
            clearInterval(ballMovingTimer);
            ball.transition({ scale: .5 });
            ball.fadeOut(200);
            lifes--;
            lifeDelete = lifesArray.pop();
            lifeDelete.remove();
            setTimeout(function() {
                startGame();
            }, 1000);
            // console.log(111);
            result = "bomb";
        }
        console.log(result);
        // return result;
        return subject;
    }

    /*function throwSubject(subject) {
        // Случайное положение предмета в туче
        var subjectWidth = parseInt(subject.css("width")),
            subjectHeight = parseInt(subject.css("height")),
            startSubjectX = randNumber(areaWidth - subjectWidth, 0),
            startSubjectY = cloudHeight - subjectHeight;

        subject.css({left: startSubjectX + "px"});
        subject.css({top: startSubjectY + "px"});
        subject.fadeIn(700);

        var subjectMovingTimer = setInterval(function() {
            subject.css({top: "+=" + 2 + "px"});
            subjectX = parseInt(subject.css("left"));
            subjectY = parseInt(subject.css("top"));

            // coords.text("X: " + (subjectX + subjectWidth / 2) + " Y: " + (subjectY + subjectHeight) + " boardX: " + (cloudHeight - subjectHeight));

            // Предмет пойман или нет
            if((subjectX + subjectWidth >= boardX && subjectX <= boardX + boardWidth)
                && subjectY + subjectHeight >= boardY) {
                catchSubject(subject);
                subject.fadeOut(300);
                clearInterval(subjectMovingTimer);
            } else if((subjectX + subjectWidth < boardX || subjectX > boardX + boardWidth)
                && subjectY + subjectHeight >= boardY + boardHeight / 2) {
                subject.transition({ scale: 0 });
                subject.fadeOut(300);
                clearInterval(subjectMovingTimer);
            }
        }, intervalSpeed);
        console.log(subject);

        return true;
    }*/

    function throwSubject() {
        var subject = subjectArray[randNumber(subjectArray.length - 1, 0)];
        var subjectWidth = parseInt(subject.css("width")),
            subjectHeight = parseInt(subject.css("height")),
            startSubjectX = randNumber(areaWidth - subjectWidth, 0),
            startSubjectY = cloudHeight - subjectHeight;

        subject.css({left: startSubjectX + "px"});
        subject.css({top: startSubjectY + "px"});
        subject.fadeIn(700);

        var subjectMovingTimer = setInterval(function() {
            subject.css({top: "+=" + 2 + "px"});
            subjectX = parseInt(subject.css("left"));
            subjectY = parseInt(subject.css("top"));

            // Предмет пойман или нет
            if((subjectX + subjectWidth >= boardX && subjectX <= boardX + boardWidth)
                && subjectY + subjectHeight >= boardY) {
                catchSubject(subject);
                subject.fadeOut(300);
                clearInterval(subjectMovingTimer);
                // return catchSubject(subject);
            } else if((subjectX + subjectWidth < boardX || subjectX > boardX + boardWidth)
                && subjectY + subjectHeight >= boardY + boardHeight / 2) {
                subject.transition({ scale: 0 });
                subject.fadeOut(300);
                clearInterval(subjectMovingTimer);
            }
        }, intervalSpeed);
        console.log(subject);

        return subject;
        // return result;
    }

    // console.log(randNumber(subjectArray.length - 1, 0));
    /*setTimeout(function() {
        setTimeout(function() {
            throwSubject(subjectArray[randNumber(subjectArray.length - 1, 0)]);
        }, randNumber(5, 1) * 1000);
    }, 5000);*/
    

    function checkCollision(ballX, ballY, ballCenterX, ballCenterY, speedX, speedY) {
        // console.log(throwSubject());
        // Проверка столкновений мяча с блоками. Проверять только когда мяч в зоне возможного нахождения блоков
        if(ballY <= cloudHeight + ballRadius) {
            // при движении снизу вверх
            if(speedY < 0) {
                for(var i = 0; i < blocks.length; i++) {
                    if( (ballCenterX >= parseInt($("#block" + i).css("left")) 
                            && ballCenterX <= parseInt($("#block" + i).css("left")) + parseInt($("#block" + i).css("width"))) 
                        && ballY == parseInt($("#block" + i).css("top")) + parseInt($("#block" + i).css("height")) ) {
                        $("#block" + i).remove();
                        blocks.splice(i, 1);
                        scores++;
                        reRunTimer(speedX, speedY, false, true);
                    } else if( (ballX + ballRadius == parseInt($("#block" + i).css("left")) 
                            || ballX == parseInt($("#block" + i).css("left")) + parseInt($("#block" + i).css("width")))
                        && (ballCenterY <= parseInt($("#block" + i).css("top")) + parseInt($("#block" + i).css("height")) 
                            && ballCenterY >= parseInt($("#block" + i).css("top"))) ) {
                        $("#block" + i).remove();
                        blocks.splice(i, 1);
                        scores++;
                        reRunTimer(speedX, speedY, true, false);
                    }
                }
            }

            // при движении свверху вниз
            if(speedY > 0) {
                for(var i = 0; i < blocks.length; i++) {
                    if( (ballCenterX >= parseInt($("#block" + i).css("left")) 
                            && ballCenterX <= parseInt($("#block" + i).css("left")) + parseInt($("#block" + i).css("width")))
                        && ballY + ballRadius == parseInt($("#block" + i).css("top")) ) {
                        $("#block" + i).remove();
                        blocks.splice(i, 1);
                        scores++;
                        reRunTimer(speedX, speedY, false, true);
                    } else if( (ballX + ballRadius == parseInt($("#block" + i).css("left")) 
                            || ballX == parseInt($("#block" + i).css("left")) + parseInt($("#block" + i).css("width")))
                        && (ballCenterY <= parseInt($("#block" + i).css("top")) + parseInt($("#block" + i).css("height")) 
                            && ballCenterY >= parseInt($("#block" + i).css("top"))) ) {
                        $("#block" + i).remove();
                        blocks.splice(i, 1);
                        scores++;
                        reRunTimer(speedX, speedY, true, false);
                    }
                }
            }
        }

        
    }

    // Постоянное движение мяча и получение его координат, проверка на столкновение с границами поля, доской и блоками
    var movingBall = function(speedX, speedY) {
        // Движение мяча
        ball.css({"left": "+=" + speedX + "px"});
        ball.css({"top": "+=" + speedY + "px"});

        ballX = parseInt(ball.css("left"));
        ballY = parseInt(ball.css("top"));
        ballCenterX = ballX + ballRadius / 2;
        ballCenterY = ballY + ballRadius / 2;

        coords.text("Speed X: " + speedX + "; Speed Y: " + speedY + "; X : " + ballX + "; Y : " + ballY);

        if(scores > 10 && scores % 5 == 0) {
            speedX = Math.ceil(speedX * 1.2);
            speedY = Math.ceil(speedY * 1.2);
        }

        /*if(throwSubject() != rocket) {
            checkCollision(ballX, ballY, ballCenterX, ballCenterY, speedX, speedY);
        }*/
        checkCollision(ballX, ballY, ballCenterX, ballCenterY, speedX, speedY);
        
        // Мяч не отбит, выходит за нижнюю границу поля, исчезает, появляется в верхнем левом углу, старт
        // if ((ballX + ballRadius <= boardX || ballX >= boardX + boardWidth) && ballY >= (areaHeight - ballRadius - boardHeight / 20)) {
        // if ((ballX + ballRadius <= boardX || ballX >= boardX + boardWidth) && ballY + ballRadius >= boardY) {
        if ((ballCenterX < boardX || ballCenterX > boardX + boardWidth) && ballY + ballRadius >= areaHeight) {
            clearInterval(ballMovingTimer);
            ball.transition({ scale: .5 });
            ball.fadeOut(200);
            lifes--;
            lifeDelete = lifesArray.pop();
            lifeDelete.remove();
            setTimeout(function() {
                startGame();
            }, 1000);
        }
        
        // Конец игры
        if (lifes == 0) {
            clearInterval(ballMovingTimer);
            setInterval(function() {
                gameOver.show().animate({"opacity": "1", "top": "30%"}, 1000);
            }, 500);
            stop.hide();
            refresh.fadeIn(200);
        }

        // Проверка на столкновение с доской
        // Если мяч попадает в доску - останавливаем текущее движение,
        // меняем направление движения на противоположное, запускаем движение в новом направлении,
        if ((ballCenterX >= boardX && ballCenterX <= boardX + boardWidth) && (ballY + ballRadius >= boardY)) {
            if (speedX >= 0) {
                ball.transition({ rotate: '360deg' });
            } else {
                ball.transition({ rotate: '-360deg' });
            }
            reRunTimer(speedX, speedY, false, true);
        }

        // Отскок мяча от верхней границы поля
        if (ballY < 0) {
            if (speedX >= 0) {
                ball.transition({ rotate: '-360deg' });
            } else {
                ball.transition({ rotate: '360deg' });
            }
            reRunTimer(speedX, speedY, false, true);
        }

        // Отскок мяча от боковых границ поля
        if (ballX  + ballRadius > areaWidth || ballX < 0) {
            if (speedX >= 0) {
                ball.transition({ rotate: '-360deg' });
            } else {
                ball.transition({ rotate: '360deg' });
            }
            reRunTimer(speedX, speedY, true, false);
        }
        
        
    }

    /*function makeCloud(totalBlocks) {
        var linesInCloud = Math.ceil(totalBlocks / blocksInLine);
        for(var i = 0; i < linesInCloud; i++) {
            for(var j = 0; j < blocksInLine; j++) {
                var blockNumber = i * blocksInLine + j;
                var ob = {
                    name: "block" + (i * j + j),
                    w: areaWidth / blocksInLine,
                    h: 30,
                    bg: "#f0f",
                    html: "<div class='block' id='block" + blockNumber + "'>",
                    bgRand: function() {
                        var r = randNumber(255, 0);
                        var g = randNumber(200, 0);
                        var b = randNumber(255, 0);
                        var a = Math.random();
                        // var bgc = "rgba(" + r + "," + g + "," + b + "," + a + ")";
                        var bgc = "rgb(" + r + "," + g + "," + b + ")";
                        return bgc;
                    },
                    coordLeft: function() {
                        var left;
                        if(this.w * blockNumber < areaWidth) {
                            left =  this.w * blockNumber;
                        } else if(this.w * blockNumber < areaWidth * 2) {
                            left =  this.w * blockNumber - areaWidth;
                        } else if(this.w * blockNumber < areaWidth * 3) {
                            left =  this.w * blockNumber - areaWidth * 2;
                        } else if(this.w * blockNumber < areaWidth * 4) {
                            left =  this.w * blockNumber - areaWidth * 3;
                        } else {
                            left =  this.w * blockNumber - areaWidth * 4;
                        }
                        return left;
                    },
                    coordTop: function() {
                        var top;
                        if(blockNumber < 20) {
                            top =  0;
                        } else if(blockNumber < 40) {
                            top = this.h;
                        } else if(blockNumber < 60) {
                            top = this.h * i;
                        } else if(blockNumber < 80) {
                            top = this.h * i;
                        } else {
                            top = this.h * i;
                        }
                        return top;
                    }
                }

                cloud.append(ob.html);
                blocks.push($("#block" + blockNumber));
                var blockLeft = ob.coordLeft();
                var blockTop = ob.coordTop();
                var blockBg = ob.bgRand();
                blocks[blockNumber].css({
                    backgroundColor: blockBg,
                    width: ob.w  + "px",
                    height: ob.h + "px",
                    left: blockLeft + "px",
                    top: blockTop + "px"
                });

                if((blockNumber + 1) == totalBlocks) break;
                // console.log(blockNumber);
            }
        }
        console.log(blocks.length);
        console.log(linesInCloud);
        cloudHeight = linesInCloud * ob.h;
        console.log(cloudHeight);
    }*/


});

$(window).load(function() {

	$(".loader_inner").fadeOut();
	$(".loader").delay(400).fadeOut("slow");

});
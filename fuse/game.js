let game;
let gameOptions = {
    startingBalls: 5,
    ballColors: 6,
    ballSpeed: 60,
    growFactor: 25,
    explode: 4
}
window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor:0x222222,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: 750,
            height: 1334
        },
        physics: {
            default: "matter",
            matter: {
                gravity: {
                    y: 0
                },
                debug: true
            }
        },
        scene: playGame
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    preload(){
        this.load.image("arrow", "arrow.png");
        this.load.spritesheet("balls", "balls.png", {
            frameWidth: 100,
            frameHeight: 100
        });
    }
    create(){
        this.ballsToReverse = [];
        this.angle = Math.PI / 2 * -1;
        for(let i = 0; i < gameOptions.startingBalls; i++){
            let posX = Phaser.Math.Between(50, game.config.width - 50);
            let posY = Phaser.Math.Between(50, game.config.height / 2);
            let frame = Phaser.Math.Between(0, gameOptions.ballColors - 1);
            this.addBall(posX, posY, frame, false);
        }
        this.addWall(game.config.width / 2, -10, game.config.width, 20);
        this.addWall(game.config.width / 2, game.config.height + 10, game.config.width, 20);
        this.addWall(-10, game.config.height / 2, 20, game.config.height);
        this.addWall(game.config.width + 10, game.config.height / 2, 20, game.config.height);
        this.playerBall = this.add.sprite(game.config.width / 2, game.config.height - 100, "balls");
        this.arrow = this.add.sprite(this.playerBall.x, this.playerBall.y - 150, "arrow");
        this.setBallAndArrow();
        this.input.on("pointerdown", this.launchBall, this);
        this.input.on("pointermove", this.moveArrow, this);
        this.matter.world.on("collisionstart", this.handleCollisionStart, this);
        this.matter.world.on("afterupdate", this.reverseMovement, this);
    }
    addWall(posX, posY, width, height){
        let wall = this.matter.add.rectangle(posX, posY, width, height, {
            isStatic: true,
        });
        wall.restitution = 1;
    }
    addBall(posX, posY, frame, isMoving){
        let ball = this.matter.add.sprite(posX, posY, "balls");
        ball.grown = 0;
        ball.setFrame(frame);
        ball.setBounce(0.4);
        ball.setCircle(50);
        ball.body.frictionAir = 0.02;
        if(isMoving){
            ball.setVelocity(gameOptions.ballSpeed * Math.cos(this.angle), gameOptions.ballSpeed * Math.sin(this.angle));
        }
    }
    setBallAndArrow(){
        this.playerBallMoving = false;
        this.playerBall.setVisible(true);
        this.playerBall.setFrame(Phaser.Math.Between(0, gameOptions.ballColors - 1));
        this.arrow.setVisible(true);
        this.arrow.x = this.playerBall.x;
        this.arrow.y = this.playerBall.y - 150;
        this.arrow.angle = -90;
        this.angle = Math.PI / 2 * -1;
    }
    moveArrow(pointer){
        this.angle = Phaser.Math.Clamp(Math.abs(Phaser.Math.Angle.Between(this.playerBall.x, this.playerBall.y, pointer.x, pointer.y)), 0.5, Math.PI - 0.5) * -1;
        this.arrow.x = this.playerBall.x + 150 * Math.cos(this.angle);
        this.arrow.y = this.playerBall.y + 150 * Math.sin(this.angle);
        this.arrow.rotation = this.angle;
    }
    reverseMovement(){
        while(this.ballsToReverse.length > 0){
            let ball = this.ballsToReverse.shift();
            ball.setVelocity(ball.mirrorMovement.body.velocity.x * -0.25, ball.mirrorMovement.body.velocity.y * -0.25);
        }
    }
    handleCollisionStart(event, bodyA, bodyB){
        if(bodyA.gameObject && bodyB.gameObject){
            if(bodyA.gameObject.frame.name == bodyB.gameObject.frame.name){
                if(bodyA.speed < bodyB.speed){
                    this.handleInclusion(bodyA.gameObject, bodyB.gameObject);
                }
                else{
                    this.handleInclusion(bodyB.gameObject, bodyA.gameObject);
                }
            }
            else{
                if(bodyA.speed < bodyB.speed){
                    this.handleBounce(bodyA.gameObject, bodyB.gameObject);
                }
                else{
                    this.handleBounce(bodyB.gameObject, bodyA.gameObject);
                }
            }
        }
    }
    handleBounce(bodyA, bodyB){
        bodyB.mirrorMovement = bodyA;
        this.ballsToReverse.push(bodyB);
    }
    handleInclusion(bodyA, bodyB){
        bodyA.grown ++;
        if(bodyA.grown == gameOptions.explode){
            for(let i = 0; i < 2; i++){
                let posX = Phaser.Math.Between(50, game.config.width - 50);
                let posY = Phaser.Math.Between(50, game.config.height / 2);
                let frame = bodyA.frame.name;
                this.addBall(posX, posY, frame, false);
            }
            bodyA.destroy();
        }
        else{
            let saveX = bodyA.x;
            let saveY = bodyA.y;
            bodyA.displayWidth = Math.max(bodyA.displayWidth, bodyB.displayWidth) + gameOptions.growFactor;
            bodyA.displayHeight = Math.max(bodyA.displayHeight, bodyB.displayHeight) + gameOptions.growFactor;
            bodyA.x = saveX;
            bodyA.y = saveY;
            bodyA.setVelocity(bodyB.body.velocity.x / 2, bodyB.body.velocity.y / 2);
        }
        bodyB.destroy();
    }
    launchBall(){
        if(!this.playerBallMoving){
            this.playerBallMoving = true;
            this.playerBall.setVisible(false);
            this.arrow.setVisible(false);
            this.addBall(this.playerBall.x, this.playerBall.y, this.playerBall.frame.name, true)
            this.time.addEvent({
                delay: 3000,
                callbackScope: this,
                callback: this.setBallAndArrow
            });
        }
    }
}

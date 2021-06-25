var game;

var gameOptions = {

    // start vertical point of the terrain, 0 = very top; 1 = very bottom
    startTerrainHeight: 0.5,

    // max slope amplitude, in pixels
    amplitude: 100,

    // slope length range, in pixels
    slopeLength: [150, 350],

    // a mountain is a a group of slopes.
    mountainsAmount: 2,

    // amount of slopes for each mountain
    slopesPerMountain: 10,

    // positive and negative car acceleration
    carAcceleration: [0.01, -0.005],

    // maximum car velocity
    maxCarVelocity: 1.2
}
window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: 0x75d5e3,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: 1334,
            height: 750
        },
        physics: {
            default: "matter",
            matter: {
                debug: true,
                debugBodyColor: 0x000000
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
    create(){

        // creation of pool arrays
        this.bodyPool = [];
        this.bodyPoolId = [];

        // array to store mountains
        this.mountainGraphics = [];

        // mountain start coordinates
        this.mountainStart = new Phaser.Math.Vector2(0, 0);

        // loop through all mountains
        for(let i = 0; i < gameOptions.mountainsAmount; i++){

            // each mountain is a graphics object
            this.mountainGraphics[i] = this.add.graphics();

            // generateTerrain is the method to generate the terrain. The arguments are the graphics object and the start position
            this.mountainStart = this.generateTerrain(this.mountainGraphics[i], this.mountainStart);
        }

        // method to add the car
        this.addCar();

        // input management
        this.input.on("pointerdown", this.accelerate, this);
        this.input.on("pointerup", this.decelerate, this);

        // car initial velocity
        this.velocity = 0;

        // car initial acceleration
        this.acceleration = 0;

        // text object with terrain information
        this.terrainInfo = this.add.text(0, game.config.height - 110, "", {
            fontFamily: "Arial",
            fontSize: 64,
            color: "#00ff00"
        });
    }

    // method to generate the terrain. Arguments: the graphics object and the start position
    generateTerrain(graphics, mountainStart){

        // array to store slope points
        let slopePoints = [];

        // variable to count the amount of slopes
        let slopes = 0;

        // slope start point
        let slopeStart = new Phaser.Math.Vector2(0, mountainStart.y);

        // set a random slope length
        let slopeLength = Phaser.Math.Between(gameOptions.slopeLength[0], gameOptions.slopeLength[1]);

        // determine slope end point, with an exception if this is the first slope of the fist mountain: we want it to be flat
        let slopeEnd = (mountainStart.x == 0) ? new Phaser.Math.Vector2(slopeStart.x + gameOptions.slopeLength[1] * 1.5, 0) : new Phaser.Math.Vector2(slopeStart.x + slopeLength, Math.random());

        // current horizontal point
        let pointX = 0;

        // while we have less slopes than regular slopes amount per mountain...
        while(slopes < gameOptions.slopesPerMountain){

            // slope interpolation value
            let interpolationVal = this.interpolate(slopeStart.y, slopeEnd.y, (pointX - slopeStart.x) / (slopeEnd.x - slopeStart.x));

            // if current point is at the end of the slope...
            if(pointX == slopeEnd.x){

                // increase slopes amount
                slopes ++;

                // next slope start position
                slopeStart = new Phaser.Math.Vector2(pointX, slopeEnd.y);

                // next slope end position
                slopeEnd = new Phaser.Math.Vector2(slopeEnd.x + Phaser.Math.Between(gameOptions.slopeLength[0], gameOptions.slopeLength[1]), Math.random());

                // no need to interpolate, we use slope start y value
                interpolationVal = slopeStart.y;
            }

            // current vertical point
            let pointY = game.config.height * gameOptions.startTerrainHeight + interpolationVal * gameOptions.amplitude;

            // add new point to slopePoints array
            slopePoints.push(new Phaser.Math.Vector2(pointX, pointY));

            // move on to next point
            pointX ++ ;
        }

        // simplify the slope
        let simpleSlope = simplify(slopePoints, 1, true);

        // place graphics object
        graphics.x = mountainStart.x;

        // draw the ground
        graphics.clear();
        graphics.moveTo(0, game.config.height);
        graphics.fillStyle(0x654b35);
        graphics.beginPath();
        simpleSlope.forEach(function(point){
            graphics.lineTo(point.x, point.y);
        }.bind(this))
        graphics.lineTo(pointX, game.config.height);
        graphics.lineTo(0, game.config.height);
        graphics.closePath();
        graphics.fillPath();

        // draw the grass
        graphics.lineStyle(16, 0x6b9b1e);
        graphics.beginPath();
        simpleSlope.forEach(function(point){
            graphics.lineTo(point.x, point.y);
        })
        graphics.strokePath();

        // loop through all simpleSlope points starting from the second
        for(let i = 1; i < simpleSlope.length; i++){

            // define a line between previous and current simpleSlope points
            let line = new Phaser.Geom.Line(simpleSlope[i - 1].x, simpleSlope[i - 1].y, simpleSlope[i].x, simpleSlope[i].y);

            // calculate line length, which is the distance between the two points
            let distance = Phaser.Geom.Line.Length(line);

            // calculate the center of the line
            let center = Phaser.Geom.Line.GetPoint(line, 0.5);

            // calculate line angle
            let angle = Phaser.Geom.Line.Angle(line);

            // if the pool is empty...
            if(this.bodyPool.length == 0){

                // create a new rectangle body
                this.matter.add.rectangle(center.x + mountainStart.x, center.y, distance, 10, {
                    isStatic: true,
                    angle: angle,
                    friction: 1,
                    restitution: 0
                });
            }

            // if the pool is not empty...
            else{

                // get the body from the pool
                let body = this.bodyPool.shift();
                this.bodyPoolId.shift();

                // reset, reshape and move the body to its new position
                this.matter.body.setPosition(body, {
                    x: center.x + mountainStart.x,
                    y: center.y
                });
                let length = body.area / 10;
                this.matter.body.setAngle(body, 0)
                this.matter.body.scale(body, 1 / length, 1);
                this.matter.body.scale(body, distance, 1);
                this.matter.body.setAngle(body, angle);
            }
        }

        // assign a custom "width" property to the graphics object
        graphics.width = pointX - 1

        // return the coordinates of last mountain point
        return new Phaser.Math.Vector2(graphics.x + pointX - 1, slopeStart.y);
    }

    // method to build the car
    addCar(){

        // add car body
        this.body = this.matter.add.rectangle(game.config.width / 8, 0, 100, 10, {
            friction: 1,
            restitution: 0
        });

        // add front wheel. I used an octagon rather than a circle just to let you see wheel movement
        this.frontWheel = this.matter.add.polygon(game.config.width / 8 + 25, 25, 8, 15, {
            friction: 1,
            restitution: 0
        });

        // add rear wheel
        this.rearWheel = this.matter.add.polygon(game.config.width / 8 - 25, 25, 8, 15, {
            friction: 1,
            restitution: 0
        });

        // these two constraints will bind front wheel to the body
        this.matter.add.constraint(this.body, this.frontWheel, 20, 0, {
            pointA: {
                x: 25,
                y: 10
            }
        });
        this.matter.add.constraint(this.body, this.frontWheel, 20, 0, {
            pointA: {
                x: 40,
                y: 10
            }
        });

        // same thing for rear wheel
        this.matter.add.constraint(this.body, this.rearWheel, 20, 0, {
            pointA: {
                x: -25,
                y: 10
            }
        });
        this.matter.add.constraint(this.body, this.rearWheel, 20, 0, {
            pointA: {
                x: -40,
                y: 10
            }
        });
    }

    // method to accelerate
    accelerate(){
        this.acceleration = gameOptions.carAcceleration[0]
    }

    // method to decelerate
    decelerate(){
        this.acceleration = gameOptions.carAcceleration[1]
    }
    update(){

        // make the game follow the car
        this.cameras.main.scrollX = this.body.position.x - game.config.width / 8

        // adjust velocity according to acceleration
        this.velocity += this.acceleration;
        this.velocity = Phaser.Math.Clamp(this.velocity, 0, gameOptions.maxCarVelocity);

        // set angular velocity to wheels
        this.matter.body.setAngularVelocity(this.frontWheel, this.velocity);
        this.matter.body.setAngularVelocity(this.rearWheel, this.velocity);

        // loop through all mountains
        this.mountainGraphics.forEach(function(item){

            // if the mountain leaves the screen to the left...
            if(this.cameras.main.scrollX > item.x + item.width + 100){

                // reuse the mountain
                this.mountainStart = this.generateTerrain(item, this.mountainStart)
            }
        }.bind(this));

        // get all bodies
        let bodies = this.matter.world.localWorld.bodies;

        // loop through all bodies
        bodies.forEach(function(body){

            // if the body is out of camera view to the left side and is not yet in the pool..
            if(this.cameras.main.scrollX > body.position.x + 200 && this.bodyPoolId.indexOf(body.id) == -1){

                // ...add the body to the pool
                this.bodyPool.push(body);
                this.bodyPoolId.push(body.id);
            }
        }.bind(this))

        // update terrain info text
        this.terrainInfo.x = this.cameras.main.scrollX + 50;
        this.terrainInfo.setText("bodies: " + bodies.length + " - pool: " + this.bodyPool.length)
    }

    // method to apply a cosine interpolation between two points
    interpolate(vFrom, vTo, delta){
        let interpolation = (1 - Math.cos(delta * Math.PI)) * 0.5;
        return vFrom * (1 - interpolation) + vTo * interpolation;
    }
}

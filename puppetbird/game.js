let game;
let gameOptions = {

    // min and max radius from crank centre where dragging is allowrd
    dragRadius: [50, 250],

    // ratio between crank rotation, in degrees, and rope movement, in pixels
    crankRatio: 0.3
}
window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: 0x222222,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: 750,
            height: 1334
        },
        scene: playGame
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}
class playGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }
    preload() {
        // load plugin responsible of drag rotate, see the official page at
        // https://rexrainbow.github.io/phaser3-rex-notes/docs/site/dragrotate/
        this.load.plugin("rexdragrotateplugin", "dragrotate-plugin.js", true);
        this.load.image("crank", "crank.png");
        this.load.image("rope", "rope.png");
        this.load.image("bird", "bird.png");
        this.load.image('sky', 'ms3-sky.png');
    }
    create() {

        this.bg = this.add.tileSprite(0, 0, 750, game.config.height, 'sky')
            .setOrigin(0, 0);
        // rope sprite
        this.rope = this.add.sprite(game.config.width / 2, game.config.height / 3, "rope");

        // set registration point to the bottom
        this.rope.setOrigin(0.5, 1);

        // bird sprite
        this.bird = this.add.sprite(game.config.width / 2, game.config.height / 3, "bird");

        // crank sprite
        this.crank = this.add.sprite(game.config.width / 2, game.config.height / 4 * 3, "crank");

        // here I just draw two circles to show drag area
        /*  let graphics = this.add.graphics();
         graphics.lineStyle(4, 0xff0000, 1);
         graphics.strokeCircle(this.crank.x, this.crank.y, gameOptions.dragRadius[0]);
         graphics.strokeCircle(this.crank.x, this.crank.y, gameOptions.dragRadius[1]); */

        // drag rotate plugin instance
        let dragRotate = this.plugins.get("rexdragrotateplugin").add(this, {

            // horizontal coordinate of origin point
            x: this.crank.x,

            // vertical coordinate of origin point
            y: this.crank.y,

            // dragging is valid when distance between touch pointer and
            // origin position is larger then minRadius and less then maxRadius.
            minRadius: gameOptions.dragRadius[0],
            maxRadius: gameOptions.dragRadius[1]
        });
        console.log(dragRotate)


        // the core of the script, "drag" listener
        dragRotate.on("drag", function(e) {

            // deltaAngle is the dragging angle around origin position, in degrees
            // we determine new rope position according to dragging angle
            let newPosition = this.rope.y + e.deltaAngle * gameOptions.crankRatio;

            // we are going to limit rope position to prevent bird to fly off the screen
            if (newPosition > 40 && newPosition < (game.config.height / 4 * 3)) {

                // adjust rope position
                this.rope.y += e.deltaAngle * gameOptions.crankRatio;

                // adjust bird position
                this.bird.y += e.deltaAngle * gameOptions.crankRatio;

                // adjust crank angle
                this.crank.angle += e.deltaAngle
            }
        }, this);

    }

    update() {
        this.bg.tilePositionX += 4;
    }
}
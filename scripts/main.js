let scene = new GameScene('Game')

let config = {
    type: Phaser.AUTO,
    width: 900,
    height: 900,
    scene: scene,
    fallSpeed: 100,
    destroySpeed: 200,
    dotSize: 100,
    boardOffset: {
        x: 100,
        y: 50
    },

    
}
window.focus();
let game = new Phaser.Game(config)


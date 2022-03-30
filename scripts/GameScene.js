
class GameScene extends Phaser.Scene {
    constructor() {
        super("Game")
    }

  preload() {
    // this.load.spritesheet("dots", "/sprites/dot.png", {
    //     frameWidth: config.dotSize,
    //     frameHeight: config.dotSize
    // });

    this.load.image('dot0', '/sprites/dots/dot0.png')
    this.load.image('dot1', '/sprites/dots/dot1.png')
    this.load.image('dot2', '/sprites/dots/dot2.png')
    this.load.image('dot3', '/sprites/dots/dot3.png')
    this.load.image('dot4', '/sprites/dots/dot4.png')

    // this.load.image('line0', '/sprites/dots/line0.png')
    // this.load.image('line1', '/sprites/dots/line1.png')
    // this.load.image('line2', '/sprites/dots/line2.png')
    // this.load.image('line3', '/sprites/dots/line3.png')
    // this.load.image('line4', '/sprites/dots/line4.png')

    this.load.spritesheet("lines", "/sprites/line.png", {
        frameWidth: config.dotSize * 3,
        frameHeight: config.dotSize * 3
    });

  }

  create() {
        this.canPick = true;
        this.dragging = false;
        this.draw3 = new Draw3({
            rows: 6,
            columns: 6,
            items: 5
        });

        this.scoreValue = 0;

        this.timeOutScore = this.add.text(10, 10, `score: ${this.scoreValue}`), {
            font: '36px VintageKing',
            fill: '0'
        }
        
        this.score()

        this.draw3.generateField();
        
        this.drawField();



        this.input.on("pointerdown", this.gemSelect, this);
        this.input.on("pointermove", this.drawPath, this);
        this.input.on("pointerup", this.removeGems, this);
  }

  score() {
    
    this.timeOutScore.setText(`score: ${this.scoreValue}`)
     
  }
  

  
  drawField(){
    let colors = this.draw3.getColors()
    let counter = 0;

    this.poolArray = [];
    this.arrowArray = [];
    for(let i = 0; i < this.draw3.getRows(); i ++){
        
        this.arrowArray[i] = [];
        for(let j = 0; j < this.draw3.getColumns(); j ++){

            
            let posX = config.boardOffset.x + config.dotSize * j + config.dotSize / 2;
            let posY = config.boardOffset.y + config.dotSize * i + config.dotSize / 2
            // let randomValue = Math.floor(Math.random() * 5);
            
          

            let gem = this.add.sprite(posX, posY, `dot${colors[counter]}`, this.draw3.valueAt(i, j));
            let arrow = this.add.sprite(posX , posY, `lines`);
            arrow.setDepth(2);
            arrow.visible = false;
            // this.draw3.generateField(i,j,randomValue)
            this.arrowArray[i][j] = arrow;
            this.draw3.setCustomData(i, j, gem);
            counter += 1;

        }
    }
}


    gemSelect(pointer){
        if(this.canPick){
            let row = Math.floor((pointer.y - config.boardOffset.y) / config.dotSize);
            let col = Math.floor((pointer.x - config.boardOffset.x) / config.dotSize);
            if(this.draw3.validPick(row, col)){
                this.canPick = false;
                this.draw3.putInChain(row, col)
                this.draw3.customDataOf(row, col).alpha = 0.5;
                this.dragging = true;
            }
        }
    }
    drawPath(pointer){
        if(this.dragging){
            let row = Math.floor((pointer.y - config.boardOffset.y) / config.dotSize);
            let col = Math.floor((pointer.x - config.boardOffset.x) / config.dotSize);
            if(this.draw3.validPick(row, col)){
                let distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.draw3.customDataOf(row, col).x, this.draw3.customDataOf(row, col).y);
                if(distance < config.dotSize * 0.4){
                    if(this.draw3.continuesChain(row, col)){
                        this.draw3.customDataOf(row, col).alpha = 0.5;
                        this.draw3.putInChain(row, col);
                        this.displayPath()
                    }
                    else{
                        if(this.draw3.backtracksChain(row, col)){
                            let removedItem = this.draw3.removeLastChainItem();
                            this.draw3.customDataOf(removedItem.row, removedItem.column).alpha = 1;
                            this.hidePath();
                            this.displayPath();
                        }
                    }
                }
            }
        }
    }
    removeGems(){
        if(this.dragging){
            this.hidePath();
            this.dragging = false;
            if(this.draw3.getChainLength() < 2){
                let chain = this.draw3.emptyChain();
                chain.forEach(function(item){
                    this.draw3.customDataOf(item.row, item.column).alpha = 1;
                }.bind(this));
                this.canPick = true;
            }
            else{
                let gemsToRemove = this.draw3.destroyChain();
                let destroyed = 0;
                gemsToRemove.forEach(function(gem){
                    this.scoreValue = this.scoreValue + 10;
                    this.poolArray.push(this.draw3.customDataOf(gem.row, gem.column))
                    destroyed ++;
                    this.tweens.add({
                        targets: this.draw3.customDataOf(gem.row, gem.column),
                        alpha: 0,
                        duration: config.destroySpeed,
                        callbackScope: this,
                        onComplete: function(event, sprite){
                            destroyed --;
                            if(destroyed == 0){
                                this.makeGemsFall();
                            }
                        }
                    });
                }.bind(this));
                this.score()
            }
        }
    }
    makeGemsFall(){
        // console.log('pool',this.poolArray)
        let moved = 0;
        let fallingMovements = this.draw3.arrangeBoardAfterChain();
        fallingMovements.forEach(function(movement){
            moved ++;
            this.tweens.add({
                targets: this.draw3.customDataOf(movement.row, movement.column),
                y: this.draw3.customDataOf(movement.row, movement.column).y + movement.deltaRow * config.dotSize,
                duration: config.fallSpeed * Math.abs(movement.deltaRow),
                callbackScope: this,
                onComplete: function(){
                    moved --;
                    if(moved == 0){
                        this.canPick = true;
                    }
                }
            })
        }.bind(this));
        let replenishMovements = this.draw3.replenishBoard();
        replenishMovements.forEach(function(movement){
            moved ++;
            let sprite = this.add.sprite(0, 0, `dot${this.draw3.valueAt(movement.row, movement.column)}`, this.draw3.valueAt(movement.row, movement.column));
            sprite.alpha = 1;
            sprite.y = config.boardOffset.y + config.dotSize * (movement.row - movement.deltaRow + 1) - config.dotSize / 2;
            sprite.x = config.boardOffset.x + config.dotSize * movement.column + config.dotSize / 2,
            sprite.setFrame(this.draw3.valueAt(movement.row, movement.column));
            this.draw3.setCustomData(movement.row, movement.column, sprite);
            this.tweens.add({
                targets: sprite,
                y: config.boardOffset.y + config.dotSize * movement.row + config.dotSize / 2,
                duration: config.fallSpeed * movement.deltaRow,
                callbackScope: this,
                onComplete: function(){
                    moved --;
                    if(moved == 0){
                        this.canPick = true;
                    }
                }
            });
        }.bind(this))
    }

    
    
    displayPath(){
        let path = this.draw3.getPath();
        path.forEach(function(item){
            this.arrowArray[item.row][item.column].visible = true;
            if(!this.draw3.isDiagonal(item.direction)){
                this.arrowArray[item.row][item.column].setFrame(0);
                this.arrowArray[item.row][item.column].angle = 90 * Math.log2(item.direction);
            }
            else{
                this.arrowArray[item.row][item.column].setFrame(1);
                this.arrowArray[item.row][item.column].angle = 90 * (item.direction - 9 + ((item.direction < 9) ? (item.direction / 3) - 1 - item.direction % 2 : 0));
            }
        }.bind(this))
    }
    hidePath(){
        this.arrowArray.forEach(function(item){
            item.forEach(function(subItem){
                subItem.visible = false;
                subItem.angle = 0;
            })
        })
    }


}
const backgroundColor="#39ac39"

class Game{
    constructor(){
        this.container=new Container();
        this.overflowTime=0;
        this.nextBallType=[]
        for(let i=0; i<4; i++){
            this.nextBallType.push(this.getTypeNumber());
        }
        this.score=0;
        
        //engine
        this.engine = Matter.Engine.create();

        this.gameContainer=document.querySelector("#game-container");

        //gui
        let str=`<div id="gui-container"></div>`;
        this.gameContainer.innerHTML+=str;

        this.guiContainer=document.querySelector("#gui-container");
        
        //container score e preview prossime 3
        str=`<div id="game-stats-container"></div>`;
        this.guiContainer.innerHTML=str;

        this.gameStatsContainer=document.querySelector("#game-stats-container");
        this.generateStartupScreen()

        //renderer
        this.render = Matter.Render.create({
            element: this.gameContainer,
            engine: this.engine,
            options: {
                wireframes: false, //rimuove l'aspetto di default
                width: 600,       //dimensioni del canvas
                height: 800,
                background: "assets/img/background_menu.png"
            }
        });

        // controlli del mouse sul canvas e configurazione
        this.mouse = Matter.Mouse.create(this.render.canvas);

        // sincronizza il mouse al renderer
        this.render.mouse = this.mouse;

        // corpi vari 
        //(matterjs usa le coordinate del centro di massa del corpo per la creazione)
        this.generateBorders();

        this.generatePreviewBall();
        //renderizza sul canvas 
        Matter.Render.run(this.render);

        // runner
        this.runner = Matter.Runner.create();
        Matter.Runner.run(this.runner, this.engine);

        //ascoltatore crea palla al click
        this.canPlace=true; //per evitare spam di click
        this.clickListener=(e)=>{this.handlePlace(e)} //con la variabile clickListener salvo la funzione per poterla rimuovere dopo
        document.querySelector("canvas").addEventListener("click", this.clickListener);

        document.querySelector("canvas").addEventListener("mousemove", (e)=>{this.refreshPreview(e)});

        //controllo collisioni
        Matter.Events.on(this.engine, "collisionStart",(e)=>{this.checkCollision(e)})

        //ciclo controlli sul container (per sconfitta)
        this.CheckTimeOutsideContainer();
    }

    generateBorders(){
        //definisco uno stile da utilizzare per i bordi del contenitore
        const borderRender={
            fillStyle: "#000"
        }
        const edgeRender={
            fillStyle: "#822"
        }

        let bottomBorder = Matter.Bodies.rectangle(300, 790, 600, 20, { isStatic: true, frictionStatic: 1, render: borderRender});
        let leftBorder = Matter.Bodies.rectangle(10, 400, 20, 800, { isStatic: true, frictionStatic: 1, render: borderRender});
        let rightBorder = Matter.Bodies.rectangle(590, 400, 20, 800, { isStatic: true, frictionStatic: 1, render: borderRender});
        //linea per far capire il limite del contenitore (isSensor: true rende il corpo trasparente)
        this.edge = Matter.Bodies.rectangle(300, 200, 600, 3, { isStatic: true, frictionStatic: 1, render:edgeRender, isSensor:true});

        let borders=[this.edge, bottomBorder, rightBorder, leftBorder];

        //aggiungo tutti gli elementi al world
        Matter.Composite.add(this.engine.world, borders);
    }
    generatePreviewBall(){
        //creazione della palla di preview
        let currentRadius=Ball.baseSize+this.nextBallType[0]*Ball.baseSize/2;
        this.currentBallPreview=Matter.Bodies.circle(200, this.edge.position.y-Ball.baseSize, currentRadius, {
            isStatic: true, 
            frictionStatic: 1, 
            isSensor:true,
            render:{
                sprite: {
                    texture: `assets/img/${Ball.ballSpriteNames[this.nextBallType[0]]}.png`,
                    xScale: currentRadius*2/Ball.imageWidth,
                    yScale: currentRadius*2/Ball.imageWidth
                }
            }
        });
        Matter.World.add(this.engine.world, this.currentBallPreview);
    }
    //funzione per controllare se un corpo è un cerchio
    isCircle(body){
        return body.circleRadius >0;
    }

    //controlla i click
    handlePlace(event){
        if(this.canPlace){
            let type=this.nextBallType[0];

            let x=event.offsetX;
            x=Math.max(x, 20);
            x=Math.min(x, 580)

            let newBall=new Ball(type,x,this.edge.position.y-Ball.baseSize);

            this.container.addBall(newBall);
            Matter.World.add(this.engine.world, newBall.matterBody);
            this.useCurrentBall();
            //viene dato un secondo per piazzare nuovamente 
            this.canPlace=false;
             //la preview non è visibile per simulare lo caduta della palla
            this.refreshPreview();
            this.placeTimeout=setTimeout(()=>{
                this.canPlace=true; 
            },800)
            
        }
    }
    checkCollision(matterEvent){
        let pairs=matterEvent.pairs //gli eventi di matterJS forniscono già liste con tutte le coppie di corpi possibili
            pairs.forEach(pair => {
                if (this.isCircle(pair.bodyA) && this.isCircle(pair.bodyB)){
                    let ball1=this.container.balls.filter((ball)=>ball.matterBody===pair.bodyA)[0];
                    let ball2=this.container.balls.filter((ball)=>ball.matterBody===pair.bodyB)[0];

                    let index1=this.container.balls.indexOf(ball1);
                    let index2=this.container.balls.indexOf(ball2);
                    
                    if (index1!=-1&&index2!=-1) {
                        this.score+=this.container.checkMerge(index1, index2, this.engine.world);
                        this.refreshGui();
                    }
                }
            });
    }
    refreshPreview(event){
        if (!this.canPlace) {
            this.currentBallPreview.render.sprite.xScale = 0.01;
            this.currentBallPreview.render.sprite.yScale = 0.01; //modo veloce per rendere la preview invisibile
            return;
        }
        else this.currentBallPreview.visible=true;

        let radius=Ball.baseSize+this.nextBallType[0]*Ball.baseSize/2;
        let x=event.offsetX;
            x=Math.max(x, 20+radius);
            x=Math.min(x, 580-radius); //per evitare preview sopra i muri

        this.currentBallPreview.position.x=x;
        this.currentBallPreview.circleRadius=radius;

        this.currentBallPreview.render.sprite.texture = `assets/img/${Ball.ballSpriteNames[this.nextBallType[0]]}.png`;
        this.currentBallPreview.render.sprite.xScale = this.currentBallPreview.circleRadius*2/Ball.imageWidth,
        this.currentBallPreview.render.sprite.yScale = this.currentBallPreview.circleRadius*2/Ball.imageWidth
    };
    //5 secondi fuori dal contenitore per perdere
    CheckTimeOutsideContainer(){
        let sound=new Audio('assets/sounds/alarm.mp3');
        let checkTimeInterval=setInterval(()=>{
            if(this.container.isOverflowing(this.edge.position.y)){
                if(this.overflowTime>2) sound.play();
                this.overflowTime++;
            }
            else {
                this.overflowTime=0;
            }
            if (this.overflowTime>7) {
                clearInterval(checkTimeInterval);
                this.Lose(); 
            }
        },1000)
    }
    //gestisce sconfitta , blocca ascoltatore
    Lose(){
        console.log("you lose")
        this.guiContainer.classList.remove("ingame");
        this.resetGame();
        
    }
    resetGame(){
        this.container.empty();
        this.overflowTime=0;
        this.score=0;
        this.nextBallType=[];
        for(let i=0; i<4; i++){
            this.nextBallType.push(this.getTypeNumber());
        }
        
        Matter.Composite.clear(this.engine.world, true);
        this.generateBorders();
    }
    //usa la palla corrente e ne aggiunge una nuova
    useCurrentBall(){
        this.nextBallType.splice(0,1)//rimuovo il primo in lista
        this.nextBallType.push(this.getTypeNumber())
        this.refreshGui()
    }
    getTypeNumber(){
        let randomNum = Math.random();
        return Math.floor(1 + randomNum * (5 - 1)); //la palla 4 è la più grande ottenibile casualmente
    }

    //la gui è absolute rispetto al div "gameContainer"(contenente il canvas)
    refreshGui(){
        //preview dell'array di palloni
        let ballPreviewContainer=`<div id="ball-preview-container">`;
        for (let typeNumber of this.nextBallType.slice(1)){
            ballPreviewContainer+=`<div class="ball-preview"><img src="assets/img/${Ball.ballSpriteNames[typeNumber]}.png" style="width:${typeNumber*8+16}px"></div>`;
        }
        ballPreviewContainer+="</div>";

        //punteggio:
        let scoreContainer=`<div id="score-container"><span id="score-text">${this.score}</span></div>`;
        document.querySelector("#game-stats-container").innerHTML=scoreContainer+ballPreviewContainer;
    }

    generateStartupScreen(){
        //menu di avvio
        let title =`<h1 id="game-title">Ball Merge</h1>`;
        let startBtn=`<button id="start-btn">Start</button>`;

        let startupContainer=`<div id="startup-container"></div>`;
        this.guiContainer.innerHTML+=startupContainer;
        document.querySelector("#startup-container").innerHTML=title+startBtn;

        document.querySelector("#start-btn").addEventListener("click",()=>this.startGame())

        //aggiunge suono ai bottoni
        document.querySelectorAll("button").forEach((btn)=>{
            btn.addEventListener("click",()=>{
                let audio = new Audio('assets/sounds/button.mp3');
                audio.play();
            })
        })
    }

    startGame(){
        this.guiContainer.classList.add("ingame");
        this.refreshGui();
    }

}


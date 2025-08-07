class Container{
    constructor(){
        this.balls=[];
    }
    addBall(ball){
        if (ball!=null) this.balls.push(ball);
    }
    //unisce due palloni creandone uno nuovo 
    //con baricentro avente come x la media delle x e come y la media delle y
    checkMerge(index1, index2, world){
        let points=0;
        //se entrambe stesso tipo e tipo<11
        if (this.balls[index1].typeNumber==this.balls[index2].typeNumber && this.balls[index1].typeNumber<11){
            points=this.balls[index1].typeNumber**2;
            let newX=(this.balls[index1].matterBody.position.x+this.balls[index2].matterBody.position.x)/2;
            let newY=(this.balls[index1].matterBody.position.y+this.balls[index2].matterBody.position.y)/2;
            let newType=this.balls[index1].typeNumber+1;
            //prima rimuove i corpi e poi ne crea uno nuovo
            Matter.World.remove(world, this.balls[index1].matterBody)
            this.balls.splice(index1,1);

            if (index1<index2) index2-- //aggiusto il secondo indice in caso di shift

            Matter.World.remove(world, this.balls[index2].matterBody)
            this.balls.splice(index2,1);

            let newBall=new Ball(newType, newX, newY)
            this.balls.push(newBall);

            Matter.World.add(world, newBall.matterBody)
            
            //effetto sonoro
            let audio = new Audio('assets/sounds/pop1.mp3');
            audio.play();
            return points
        }
        //se indice è 11 (il tipo di pallone massimo) allora elimina e non crea altro
        else if(this.balls[index1].typeNumber==this.balls[index2].typeNumber){
            points=this.balls[index1].typeNumber**2;
            Matter.World.remove(world, this.balls[index1].matterBody)
            this.balls.splice(index1,1);

            if (index1<index2) index2--

            Matter.World.remove(world, this.balls[index2].matterBody)
            this.balls.splice(index2,1);

            //effetto sonoro
            let audio = new Audio('assets/sounds/victoryBell.mp3');
            audio.play(); 
        }
        return points   
    }
    //se almeno una palla ha centro di massa sopra la soglia c'è overflow
    isOverflowing(y){
        if (this.balls.filter((ball)=>ball.matterBody.position.y<y).length>0){
            return true
        }
    }
    empty(){
        this.balls=[];
    }

    
}
class Ball{
    constructor(typeNumber, x, y){ //in base al numero verrà scelta la palla 
        this.typeNumber=typeNumber;
        let radius=Ball.baseSize+typeNumber*Ball.baseSize/2;

        this.matterBody=Matter.Bodies.circle(x, y, radius, {    
            restitution: 0.2,
            render: {
                sprite: {
                    texture: `assets/img/${Ball.ballSpriteNames[typeNumber]}.png`,
                    xScale: radius*2/Ball.imageWidth, //l'immagine va scalata in proporzione al diametro della palla
                    yScale: radius*2/Ball.imageWidth
                }
            }})
    }
    static baseSize=20;
    static imageWidth=256;
    static ballSpriteNames={
        1:"golf",
        2:"tennis",
        3:"baseball",
        4:"cricket",
        5:"handball",
        6:"volleyball",
        7:"bowling",
        8:"soccer",
        9:"basketball",
        10:"beach",
        11:"yoga"
    }
}
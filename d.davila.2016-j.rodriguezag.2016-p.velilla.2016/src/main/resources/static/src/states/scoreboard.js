Spacewar.scoreboardState = function(game) {

}

Spacewar.scoreboardState.prototype = {

	init : function() {
		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Entering **scoreboard** state");
		}
	},

	preload : function() {

	},

	create : function() {
		/*game.global.myPlayer.room.name = 'MENU';
		game.global.myPlayer.room.idHost = -1;*/
		this.showScore();
		
		//Botón ir atrás
		var button = this.game.add.button(10, 10, 'backButton', this.goBack, this, 2, 1, 0);
        button.width = 75;
        button.height = 75;
	},

	update : function() {
		//game.state.start('gameState')
		console.log("SCOREBOarD");
	},
	
	goBack:function(){
		var msg ={
				event: "RESET_SCORE"
		}
		game.global.socket.send(JSON.stringify(msg))
		game.state.start('menuState');
	},

	showScore:function(){

		if(game.global.myPlayer.winner){
			this.winTextwinner = this.game.add.text(this.game.width / 2 - 250, 100 , "YOU WIN!", { font: "40px Chakra Petch", fill: "#ffffff", align: "center" });
		}

		/*game.global.myPlayer.room.score.sort(function(a, b){return b-a});

		var posAnterior = game.global.myPlayer.room.score[0]
		for(i = 1;i < game.global.myPlayer.room.score.length;i++){
			if(posAnterior.score <  game.global.myPlayer.room.score[i].score){
				game.global.myPlayer.room.score[i-1] = game.global.myPlayer.room.score[i]
				game.global.myPlayer.room.score[i] = posAnterior
			}
			posAnterior = game.global.myPlayer.room.score[i] 
		}*/
		
		for(i = 0; i<game.global.myPlayer.room.score.length;i++){
			this.score = this.game.add.text(this.game.width / 2, 100 + (i*40), "Jugador: " + game.global.myPlayer.room.score[i].nombre + " Puntuacion: " + game.global.myPlayer.room.score[i].score, { font: "20px Chakra Petch", fill: "#ffffff", align: "center" });
		}
	}
	
}
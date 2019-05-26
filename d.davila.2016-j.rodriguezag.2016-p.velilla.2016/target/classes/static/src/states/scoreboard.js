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
			if(game.global.myPlayer.room.gameMode == "classic"){
				this.winTextwinner = this.game.add.text(this.game.width / 2 - 250, 100 , "YOU WIN!", { font: "40px Chakra Petch", fill: "#ffffff", align: "center" });
			}else{
				this.winTextwinner = this.game.add.text(this.game.width / 2 - 250, 300 , "WINNER WINNER " + "\n" + " CHICKEN DINNER!", { font: "40px Chakra Petch", fill: "#ffffff", align: "center" });
			}
			
		}

		var puntuacionesOrdenadas = this.ordenarPuntuaciones(game.global.myPlayer.room.score);

		for(i = 0; i<game.global.myPlayer.room.score.length;i++){
			this.score = this.game.add.text(this.game.width / 2 - 100, 100 + (i*40), "Jugador: " +puntuacionesOrdenadas[i].nombre + " Puntuacion: " + puntuacionesOrdenadas[i].score, { font: "20px Chakra Petch", fill: "#ffffff", align: "center" });
		}
	},

	ordenarPuntuaciones: function(puntuaciones){
		var aux_elem;

		for (i = 0; i < puntuaciones.length - 1; i++)
		{
			for (j = 1; j < puntuaciones.length; j++)
			{
				if (puntuaciones[j].score > puntuaciones[j-1].score)
				{   // si el elemento anterior es mayor, hacemos el cambio
					aux_elem = puntuaciones[j];
					puntuaciones[j] = puntuaciones[j-1];
					puntuaciones[j-1] = aux_elem;
				}
			}
		}

		return puntuaciones;
	}
	
}
Spacewar.matchmakingState = function(game) {

}

Spacewar.matchmakingState.prototype = {

	init : function() {
		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Entering **MATCH-MAKING** state");
		}
		
		// We create a procedural starfield background
		this.numStars = 100
		for (var i = 0; i < this.numStars; i++) {
			let sprite = game.add.sprite(game.world.randomX,
					game.world.randomY, 'spacewar', 'staralpha.png');
			let random = game.rnd.realInRange(0, 0.6);
			sprite.scale.setTo(random, random)
		}

		//Crear texto
		Spacewar.matchmakingState.textoNumJugadores = this.game.add.text(200,200 , "", { font: "80px Chakra Petch", fill: "#ffffff", align: "center" });

		this.hideHTML();
	},

	preload : function() {
		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Searching room...");
		}
	},

	create : function() {
		
	},

	update : function() {
		if (typeof game.global.myPlayer.room !== 'undefined') {
			if (game.global.DEBUG_MODE) {
				console.log("[DEBUG] Joined room " + game.global.myPlayer.room);
			}
			//game.state.start('roomState')
		}

		let msg = { 
			event: 'CHECK_ESTADO',
			roomName: game.global.myPlayer.room.name
		}

		game.global.socket.send(JSON.stringify(msg));
		//console.log("MATCHMAKING");
	},

	updateText:function(numJugadores){
		//Updatear texto
		Spacewar.matchmakingState.textoNumJugadores.setText(numJugadores);
	},

	startGame:function(){
		//game.state.start('gameState');
		var msg={
			event : "ROOM_READY",
			ready : true
		}
		game.global.socket.send(JSON.stringify(msg));
	},

	hideHTML: function(){
		document.getElementById("RoomName").style.display = "none";
		document.getElementById("RoomGamemode").style.display = "none";
		document.getElementById("RoomMaxPlayers").style.display = "none";
		document.getElementById("RoomCreate").style.display = "none";
	
		document.getElementById("RoomNameSearch").style.display = "none";
		document.getElementById("RoomJoin").style.display = "none";

		if(game.global.myPlayer.room.idHost == game.global.myPlayer.id){
			document.getElementById("startGame").style.display = "block";
		}
		
	}


}
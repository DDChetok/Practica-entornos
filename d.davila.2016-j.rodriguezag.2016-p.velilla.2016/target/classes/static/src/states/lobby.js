Spacewar.lobbyState = function(game) {
	this.createRoomText;
}

Spacewar.lobbyState.prototype = {

	init : function() {
		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Entering **LOBBY** state");
		}

		// We create a procedural starfield background
		this.numStars = 100
		for (var i = 0; i < this.numStars; i++) {
			let sprite = game.add.sprite(game.world.randomX,
					game.world.randomY, 'spacewar', 'staralpha.png');
			let random = game.rnd.realInRange(0, 0.6);
			sprite.scale.setTo(random, random)
		}
	},

	preload : function() {

	},

	create : function() {
		//Mostrar HTML
		this.showHTML();

		//Botón ir atrás
		var button = this.game.add.button(10, 10, 'backButton', this.goBack, this, 2, 1, 0);
        button.width = 75;
        button.height = 75;

		
	},

	updateText:function(string){
		//Updatear texto
		this.createRoomText = game.add.text(game.width/2, 100, "", { font: "40px Chakra Petch", fill: "#ffffff", align: "center" });
		this.createRoomText.anchor.setTo(0.5, 0.5);
		this.createRoomText.fixedToCamera = true;
		this.createRoomText.setText(string);
	},

	update : function() {

	},

	createRoom: function(){
		Spacewar.menuState.prototype.activeKeys();

		var msg = {
			event: "CREATE_ROOM_REQUEST",
			roomName : document.getElementById("RoomName").value,
			roomGamemode : document.getElementById("RoomGamemode").value,
			roomMaxPlayers :  document.getElementById("RoomMaxPlayers").value
		}
		
		//No puedes crear una sala sin nombre
		if(msg.roomName != ""){
			//Para el modo classic solo se permiten 2 jugadores. El battle royale tiene un mínimo de 2 y un máximode 50
			if(msg.roomMaxPlayers < game.global.minPlayersPorPartida || msg.roomGamemode == "classic"){
				msg.roomMaxPlayers = game.global.minPlayersPorPartida;
			}
			if(msg.roomMaxPlayers > game.global.maxPlayersPorPartida){
				msg.roomMaxPlayers = game.global.maxPlayersPorPartida;
			}

			game.global.socket.send(JSON.stringify(msg));
		}
		

	},

	showHTML: function(){
		document.getElementById("RoomName").style.display = "block";
		document.getElementById("RoomGamemode").style.display = "block";
		document.getElementById("RoomMaxPlayers").style.display = "block";
		document.getElementById("RoomCreate").style.display = "block";
	},

	goBack:function(){
		Spacewar.menuState.prototype.activeKeys();
		game.state.start('menuState');
	}
}
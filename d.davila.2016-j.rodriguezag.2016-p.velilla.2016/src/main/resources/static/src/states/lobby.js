Spacewar.lobbyState = function(game) {

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
		//game.state.start('matchmakingState')

		//Mostrar HTML
		this.showHTML();

		//Botón ir atrás
		var button = this.game.add.button(10, 10, 'backButton', this.goBack, this, 2, 1, 0);
        button.width = 75;
        button.height = 75;

        //button.onInputOver.add(overButton, this);
	},

	update : function() {

	},

	createRoom: function(){
		var msg = {
			event: "CREATE_ROOM_REQUEST",
			roomName : document.getElementById("RoomName").value,
			roomGamemode : document.getElementById("RoomGamemode").value,
			roomMaxPlayers :  document.getElementById("RoomMaxPlayers").value
		}
		

		game.global.socket.send(JSON.stringify(msg));

	},

	showHTML: function(){
		document.getElementById("RoomName").style.display = "block";
		document.getElementById("RoomGamemode").style.display = "block";
		document.getElementById("RoomMaxPlayers").style.display = "block";
		document.getElementById("RoomCreate").style.display = "block";
	},

	goBack:function(){
		game.state.start('menuState');
	}
}
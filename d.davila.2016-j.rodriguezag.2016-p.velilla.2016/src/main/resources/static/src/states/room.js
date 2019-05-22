Spacewar.roomState = function(game) {

}

Spacewar.roomState.prototype = {

	init : function() {
		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Entering **ROOM** state");
		}
	},

	preload : function() {

	},

	create : function() {
		this.showHTML();

		//Botón ir atrás
		var button = this.game.add.button(10, 10, 'backButton', this.goBack, this, 2, 1, 0);
        button.width = 75;
        button.height = 75;
	},

	update : function() {
		//game.state.start('gameState')
		console.log("ROOM");
	},

	joinRoom: function(){
		var msg = {
			event: "JOIN_ROOM_REQUEST",
			roomName : document.getElementById("RoomNameSearch").value
		}
		
		game.global.socket.send(JSON.stringify(msg));

	},


	showHTML: function(){
		document.getElementById("RoomNameSearch").style.display = "block";
		document.getElementById("RoomJoin").style.display = "block";
	},
	
	goBack:function(){
		game.state.start('menuState');
	}

	
}
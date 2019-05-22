Spacewar.loginState = function(game) {

}

Spacewar.loginState.prototype = {

	init : function() {
		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Entering **LOGIN** state");
		}
	},

	preload : function() {

	},

	create : function() {
		this.showHTML();
	},

	update : function() {
		//game.state.start('gameState')
		console.log("LOGIN");
    },
    
    enterPlayerName: function(){
		var msg = {
			event: "ADD_PLAYER_NAME_REQUEST",
			playername : document.getElementById("enterPlayerName").value
			
        }
		
        game.global.socket.send(JSON.stringify(msg));
        game.state.start('menuState')
	},
	
	showHTML: function(){
		document.getElementById("enterPlayerName").style.display = "block";
		document.getElementById("confirmPlayerName").style.display = "block";
	}

	
}
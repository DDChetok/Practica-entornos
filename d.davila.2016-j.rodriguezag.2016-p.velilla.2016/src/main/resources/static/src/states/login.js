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

		this.createNameText =  this.game.add.text(this.game.width/2, 100, "Insert your name", { font: "40px Chakra Petch", fill: "#ffffff", align: "center" });
		this.createNameText.anchor.setTo(0.5, 0.5);
		this.createNameText.fixedToCamera = true;
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
		game.global.myPlayer.PlayerNombre = document.getElementById("enterPlayerName").value
		
        game.state.start('menuState')
	},
	
	showHTML: function(){
		document.getElementById("enterPlayerName").style.display = "block";
		document.getElementById("confirmPlayerName").style.display = "block";
	}

	
}
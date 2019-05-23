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
	
	goBack:function(){
		game.state.start('menuState');
	}

	
}
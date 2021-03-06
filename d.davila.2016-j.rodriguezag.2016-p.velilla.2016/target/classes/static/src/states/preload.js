Spacewar.preloadState = function(game) {

}

Spacewar.preloadState.prototype = {

	init : function() {
		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Entering **PRELOAD** state");
		}
	},

	preload : function() {
		game.load.atlas('spacewar', 'assets/atlas/spacewar.png',
				'assets/atlas/spacewar.json',
				Phaser.Loader.TEXTURE_ATLAS_JSON_HASH)
		game.load.atlas('explosion', 'assets/atlas/explosion.png',
				'assets/atlas/explosion.json',
				Phaser.Loader.TEXTURE_ATLAS_JSON_HASH)

		game.load.image('backButton', 'assets/images/backButton.png');
		game.load.image('redHealthBar', 'assets/images/barra_vida_roja.png');
		game.load.image('healthBar', 'assets/images/barra_vida.png');
	},

	create : function() {
		game.state.start('loginState')
	},

	update : function() {

	}
}
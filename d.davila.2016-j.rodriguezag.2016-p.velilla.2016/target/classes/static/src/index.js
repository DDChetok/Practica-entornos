window.onload = function() {

	game = new Phaser.Game(1024, 600, Phaser.AUTO, 'gameDiv')


	// GLOBAL VARIABLES
	game.global = {
		FPS : 30,
		DEBUG_MODE : false,
		socket : null,
		myPlayer : new Object(),
		otherPlayers : [],
		projectiles : []
	}

	// WEBSOCKET CONFIGURATOR
	game.global.socket = new WebSocket("ws://"+ window.location.host +"/spacewar")
	
	game.global.socket.onopen = () => {
		if (game.global.DEBUG_MODE) {
			console.log('[DEBUG] WebSocket connection opened.')
		}
	}

	game.global.socket.onclose = () => {
		if (game.global.DEBUG_MODE) {
			console.log('[DEBUG] WebSocket connection closed.')
		}
	}
	
	///////////CHAT////////////////////
	$('#send-btn').click(() => {
		var msg = {
			name : $('#name').val(),
			message : $('#message').val(),
			event:'CHAT'
		}
		
		$('#message').val('');
		
	    $('#chat').val($('#chat').val() + "\n" + msg.name + ": " + msg.message);
	    
	    game.global.socket.send(JSON.stringify(msg));
	});
	//////////////////////////////////////
	
	game.global.socket.onmessage = (message) => {
		var msg = JSON.parse(message.data);
		switch (msg.event) {
		case 'JOIN_ROOM_REQUEST':
			if(msg.existe){
				console.log("Te has unido a la sala");
				game.global.myPlayer.room = {
					name : msg.roomName
				}
				game.global.myPlayer.vida = msg.vida
				game.state.start('matchmakingState');
			}else{
				console.log("No existe ninguna sala con ese nombre");
			}
			break;
		case 'CHECK_ESTADO':
			console.log(msg.numJugadores);
			Spacewar.matchmakingState.prototype.updateText(msg.numJugadores);
			if(msg.numJugadores >= msg.maxJugadores){
				
				/*for (i = 0;i < game.global.otherPlayers.length;i++){
					delete game.global.otherPlayers[i];
				}*/
				game.state.start('gameState');

			}
			break;
		case 'CHAT':
			console.log("WS message: " + msg.message);
			$('#chat').val($('#chat').val() + "\n" + msg.name + ": " + msg.message);
			break;
		case 'CREATE_ROOM_REQUEST' :
			if(msg.salaCreada){
				console.log("Se ha creado la sala " + msg.roomName + " para jugar " + msg.roomGamemode );
				game.global.myPlayer.room = {
					name : msg.roomName
				}
				game.state.start('matchmakingState');
			}else{
				console.log("Ya hay una sala con ese nombre, gl in esports :(");
			}
			
			break;
		case 'JOIN':
			if (game.global.DEBUG_MODE) {
				console.log('[DEBUG] JOIN message recieved')
				console.dir(msg)
			}
			game.global.myPlayer.id = msg.id
			game.global.myPlayer.shipType = msg.shipType
			game.global.myPlayer.room = {
				name : msg.roomName
			}
			game.global.myPlayer.PlayerNombre = document.getElementById("enterPlayerName").value
			
			
			if (game.global.DEBUG_MODE) {
				console.log('[DEBUG] ID assigned to player: ' + game.global.myPlayer.id)
			}
			break

		case 'GAME STATE UPDATE' :
			if (game.global.DEBUG_MODE) {
				console.log('[DEBUG] GAME STATE UPDATE message recieved')
				console.dir(msg)
			}
			
			if (game.global.myPlayer.vida <= 0){
				game.global.myPlayer.room.name = "MENU";
				game.state.start("menuState");
			}
			
			if (typeof game.global.myPlayer.image !== 'undefined') {
				for (var player of msg.players) {
					if (game.global.myPlayer.id == player.id) {
						game.global.myPlayer.vida = player.vida;
						game.global.myPlayer.image.x = player.posX
						game.global.myPlayer.image.y = player.posY
						game.global.myPlayer.image.angle = player.facingAngle						
					} else {
						if(game.global.myPlayer.room.name == player.nombre){
							if (typeof game.global.otherPlayers[player.id] == 'undefined') {
								game.global.otherPlayers[player.id] = {
										image : game.add.sprite(player.posX, player.posY, 'spacewar', player.shipType)
									}
								game.global.otherPlayers[player.id].image.anchor.setTo(0.5, 0.5)
							} else {
								game.global.otherPlayers[player.id].image.alive = true;
								game.global.otherPlayers[player.id].image.visible = true;
								game.global.otherPlayers[player.id].image.x = player.posX
								game.global.otherPlayers[player.id].image.y = player.posY
								game.global.otherPlayers[player.id].image.angle = player.facingAngle
								//game.global.otherPlayers[player.id].image.destroy();
							}
						
					}
				}
				}
			}
				for (var projectile of msg.projectiles) {
					if(game.global.myPlayer.room.name == player.nombre){
						if (projectile.isAlive) {
							game.global.projectiles[projectile.id].image.x = projectile.posX
							game.global.projectiles[projectile.id].image.y = projectile.posY
							if (game.global.projectiles[projectile.id].image.visible === false) {
								game.global.projectiles[projectile.id].image.angle = projectile.facingAngle
								game.global.projectiles[projectile.id].image.visible = true
							}
						} else {
							if (projectile.isHit) {
								// we load explosion
								let explosion = game.add.sprite(projectile.posX, projectile.posY, 'explosion')
								explosion.animations.add('explosion')
								explosion.anchor.setTo(0.5, 0.5)
								explosion.scale.setTo(2, 2)
								explosion.animations.play('explosion', 15, false, true)
							}
							game.global.projectiles[projectile.id].image.visible = false
						}
				}
			}
			break
		case 'REMOVE PLAYER' :
			if (game.global.DEBUG_MODE) {
				console.log('[DEBUG] REMOVE PLAYER message recieved')
				console.dir(msg.players)
			}
			if(msg.id !== game.global.myPlayer.id){
				//game.global.otherPlayers[msg.id].image.destroy()
				//delete game.global.otherPlayers[msg.id]
			}
		default :
			console.dir(msg)
			break
		}
	}

	// PHASER SCENE CONFIGURATOR
	game.state.add('bootState', Spacewar.bootState)
	game.state.add('preloadState', Spacewar.preloadState)
	game.state.add('menuState', Spacewar.menuState)
	game.state.add('lobbyState', Spacewar.lobbyState)
	game.state.add('matchmakingState', Spacewar.matchmakingState)
	game.state.add('roomState', Spacewar.roomState)
	game.state.add('gameState', Spacewar.gameState)
	game.state.add('loginState', Spacewar.loginState)

	game.state.start('bootState')

	
}
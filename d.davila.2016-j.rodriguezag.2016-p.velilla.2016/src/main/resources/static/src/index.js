window.onload = function() {

	game = new Phaser.Game(1024, 600, Phaser.AUTO, 'gameDiv')


	// GLOBAL VARIABLES
	game.global = {
		FPS : 30,
		DEBUG_MODE : false,
		socket : null,
		myPlayer : new Object(),
		otherPlayers : [],
		projectiles : [],
		maxAnchoBarraVida: 115,
		maxAltoBarraVida: 10,
		maxAnchoBarraVidaOtherPlayer: 70,
		maxAltoBarraVidaOtherPlayer: 5,
		vidaMax: 100,
		minPlayersPorPartida: 2,
		maxPlayersPorPartida: 50
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
			name : game.global.myPlayer.PlayerNombre,
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
		//El server responde si la sala existe o no, y si es así guarda la información de la misma
		case 'JOIN_ROOM_REQUEST':
			if(msg.existe){
				console.log("Te has unido a la sala");
				game.global.myPlayer.room = {
					name : msg.roomName,
					idHost: msg.idHost,
					gameMode : msg.roomGamemode,
					score: []
				}
				game.global.myPlayer.vida = msg.vida
				game.state.start('matchmakingState');
			}else{
				Spacewar.menuState.prototype.updateText("No hay ninguna sala disponible");
			}
			break;
		//Comprueba si se puede empezar la partida
		case 'CHECK_ESTADO':
			Spacewar.matchmakingState.prototype.updateText(msg.numJugadores);
			if(msg.ready){
				game.state.start('gameState');
			}
			break;
		
		//Recibe un mensaje de chat y lo muestra
		case 'CHAT':
			console.log("WS message: " + msg.message);
			if(msg.name != game.global.myPlayer.PlayerNombre){
				$('#chat').val($('#chat').val() + "\n" + msg.name + ": " + msg.message);
			}
			break;
		
		//Recibe si se ha podido crear o no la sala, y si es así, guarda su información
		case 'CREATE_ROOM_REQUEST' :
			if(msg.salaCreada){
				game.global.myPlayer.room = {
					name : msg.roomName,
					idHost : msg.idHost,
					gameMode : msg.roomGamemode,
					score: []
				}
				game.state.start('matchmakingState');
			}else{
				Spacewar.lobbyState.prototype.updateText("Ya hay una sala con ese nombre :(");
			}
			break;

		//Da al jugador un id,una nave y una room por defecto
		case 'JOIN':
			if (game.global.DEBUG_MODE) {
				console.log('[DEBUG] JOIN message recieved')
				console.dir(msg)
			}
			game.global.myPlayer.id = msg.id
			game.global.myPlayer.shipType = msg.shipType
			game.global.myPlayer.room = {
				name : msg.roomName,
				idHost: msg.idHost
			}
			
			if (game.global.DEBUG_MODE) {
				console.log('[DEBUG] ID assigned to player: ' + game.global.myPlayer.id)
			}
			break

		//Recibe la información de la partida
		case 'GAME STATE UPDATE' :
			if (game.global.DEBUG_MODE) {
				console.log('[DEBUG] GAME STATE UPDATE message recieved')
				console.dir(msg)
			}

			//Actualiza el texto de las rondas(classic) o el número de naves vivas (battle royale)
			if(typeof Spacewar.gameState.rondasText !== 'undefined' && msg.rondasPerdidasOtrosJugadores.length >= 2){
				if(msg.roomGamemode == "classic"){
					Spacewar.gameState.rondasText.setText(msg.rondasPerdidasOtrosJugadores[0].rondasPerdidas + " - " + msg.rondasPerdidasOtrosJugadores[1].rondasPerdidas);
				}else if(msg.roomGamemode == "battle_royale"){
					Spacewar.gameState.rondasText.setText(msg.numVivos + " ships alive" );
				}
			}
			
			if (typeof game.global.myPlayer.image !== 'undefined') {
				for (var player of msg.players) {
					if (game.global.myPlayer.id == player.id) { //Actualiza a tu jugador

						checkMuerte(game.global.myPlayer,player.vida,msg.puntuaciones,msg.roomGamemode,player.rondasPerdidas);
						actualizarPosicion(game.global.myPlayer,player);
						crearTextoNombre(game.global.myPlayer);
						crearBarraVida(game.global.myPlayer);

						
					} else { //OTROS JUGADORES
								
							if (typeof game.global.otherPlayers[player.id] == 'undefined') { //Crear otros jugadores si no existen ya
								game.global.otherPlayers[player.id] = {
										image : game.add.sprite(player.posX, player.posY, 'spacewar', player.shipType),
									}
								game.global.otherPlayers[player.id].image.anchor.setTo(0.5, 0.5)
								
							} else { //Actualizar otros jugadores si ya existen
								
								crearBarraVidaOtherPlayer(game.global.otherPlayers[player.id]);
								game.global.otherPlayers[player.id].vida = player.vida;
								game.global.otherPlayers[player.id].image.alive = true;
								game.global.otherPlayers[player.id].image.visible = true;
								game.global.otherPlayers[player.id].image.x = player.posX
								game.global.otherPlayers[player.id].image.y = player.posY
								game.global.otherPlayers[player.id].image.angle = player.facingAngle

								crearTextoNombreOtherPlayers(game.global.otherPlayers[player.id],player.PlayerNombre)
							}
	
					}
				}
			}
				for (var projectile of msg.projectiles) {
						if (projectile.isAlive) { //Pinta los proyectiles
							game.global.projectiles[projectile.id].image.x = projectile.posX
							game.global.projectiles[projectile.id].image.y = projectile.posY
							if (game.global.projectiles[projectile.id].image.visible === false) {
								game.global.projectiles[projectile.id].image.angle = projectile.facingAngle
								game.global.projectiles[projectile.id].image.visible = true
							}
						} else {
							if (projectile.isHit) {
								//Pinta las explosiones
								let explosion = game.add.sprite(projectile.posX, projectile.posY, 'explosion')
								explosion.animations.add('explosion')
								explosion.anchor.setTo(0.5, 0.5)
								explosion.scale.setTo(2, 2)
								explosion.animations.play('explosion', 15, false, true)
							}
							game.global.projectiles[projectile.id].image.visible = false
						}
			}

			//Si se acaba la partida y no estás en el menú, pasas a la pantalla de puntuaciones
			if(msg.acabada == true && game.global.myPlayer.room.name != 'MENU' && msg.room == game.global.myPlayer.room.name){
				var mess = {
						event: "ACABADA"
				}
				game.global.myPlayer.winner = true;
				game.global.myPlayer.room.score = msg.puntuaciones;

				game.global.socket.send(JSON.stringify(mess));
				game.state.start("scoreboardState");
				
				
			}
			break

		//Borra a los jugadores que no están en tu sala
		case 'REMOVE PLAYER' :
			if (game.global.DEBUG_MODE) {
				console.log('[DEBUG] REMOVE PLAYER message recieved')
				console.dir(msg.players)
			}
			if(msg.id !== game.global.myPlayer.id && typeof game.global.otherPlayers[msg.id] !== 'undefined'){
				game.global.otherPlayers[msg.id].image.destroy()
				game.global.otherPlayers[msg.id].textoNombre.destroy()
				game.global.otherPlayers[msg.id].healthBar.destroy();
				game.global.otherPlayers[msg.id].redHealthBar.destroy();
				delete game.global.otherPlayers[msg.id]
			}
			break;

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
	game.state.add('scoreboardState', Spacewar.scoreboardState)

	game.state.start('bootState')
	
}

//Comprueba qué pasa cuando mueres
function checkMuerte(player,vida,puntuaciones,roomGamemode,rondasPerdidas){
	game.global.myPlayer.vida = vida;
	if (player.vida == 0){ //Si el jugador muere
		game.global.myPlayer.vida = 100;

		if(roomGamemode == "classic"){
			if(rondasPerdidas >= 1){ 
				player.room.name = "MENU";
		
				var msg = {
					event: "DESTRUIDO",
					room: player.room.name
				}
				game.global.socket.send(JSON.stringify(msg))
		
				game.global.myPlayer.room.score = puntuaciones;
				game.state.start("scoreboardState");
			}else{
				var msg = {
					event: "NEW_ROUND"
				}

				game.global.socket.send(JSON.stringify(msg))
			}
		}else{
			player.room.name = "MENU";
		
			var msg = {
				event: "DESTRUIDO",
				room: player.room.name
			}
			game.global.socket.send(JSON.stringify(msg))
	
			game.global.myPlayer.room.score = puntuaciones;
			game.state.start("scoreboardState");
		}
		
	}

}

function actualizarPosicion(player,playerDelServer){
	player.image.x = playerDelServer.posX
	player.image.y = playerDelServer.posY
	player.image.angle = playerDelServer.facingAngle
}

function crearBarraVidaOtherPlayer(player){
	if(typeof player.redHealthBar == 'undefined'){ //Crea si no existe
		player.redHealthBar = game.add.image(player.image.x - 35, player.image.y - 45, 'redHealthBar');
		player.redHealthBar.width = game.global.maxAnchoBarraVidaOtherPlayer;
		player.redHealthBar.height = game.global.maxAltoBarraVidaOtherPlayer;

		player.healthBar = game.add.image(player.x - 35, player.y - 45, 'healthBar');					
		player.healthBar.width = game.global.maxAnchoBarraVidaOtherPlayer;
		player.healthBar.height = game.global.maxAltoBarraVidaOtherPlayer;	
	}else{ //Actualiza si ya existe
		Spacewar.gameState.prototype.updateHealthBarOtherPlayer(player);

		player.healthBar.x = player.image.x  -  35;
		player.healthBar.y = player.image.y - 45;		

		player.redHealthBar.x = player.image.x -  35;
		player.redHealthBar.y = player.image.y - 45;
	}
}

function crearBarraVida(player){
	if(typeof player.redHealthBar == 'undefined'){ //Crea si no existe
		player.redHealthBar = game.add.image(player.image.x - 58, player.image.y - 60, 'redHealthBar');
		player.redHealthBar.width = game.global.maxAnchoBarraVida;
		player.redHealthBar.height = game.global.maxAltoBarraVida;

		player.healthBar = game.add.image(player.x - 58, player.y - 60, 'healthBar');					
		player.healthBar.width = game.global.maxAnchoBarraVida;
		player.healthBar.height = game.global.maxAltoBarraVida;	
	}else{ //Actualiza si ya existe
		Spacewar.gameState.prototype.updateHealthBar(player);

		player.healthBar.x = player.image.x  - 58;
		player.healthBar.y = player.image.y - 60;		

		player.redHealthBar.x = player.image.x - 58;
		player.redHealthBar.y = player.image.y - 60;
	}
}

function crearTextoNombreOtherPlayers(player,nombre){
	if (typeof player.textoNombre == 'undefined') {
		player.textoNombre = game.add.text(player.image.x, player.image.y + 20,nombre, { font: "20px Chakra Petch", fill: "#ffffff", align: "center" })
		player.textoNombre.anchor.setTo(0.5, 0.5)
	}else{
		player.textoNombre.setText(nombre)
		player.textoNombre.position.x = player.image.x;
		player.textoNombre.position.y = player.image.y + 35;
	}
}

function crearTextoNombre(player){
	if (typeof player.textoNombre == 'undefined') {
		player.textoNombre = game.add.text(player.image.x, player.image.y + 20,player.PlayerNombre, { font: "20px Chakra Petch", fill: "#ffffff", align: "center" })
		player.textoNombre.anchor.setTo(0.5, 0.5)

	}else{
		player.textoNombre.setText(player.PlayerNombre)
		player.textoNombre.position.x = player.image.x;
		player.textoNombre.position.y = player.image.y - 33;
	}
}
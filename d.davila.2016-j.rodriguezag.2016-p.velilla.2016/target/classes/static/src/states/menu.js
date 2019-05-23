Spacewar.menuState = function(game) {
	this.bulletTime
	this.fireBullet
	this.numStars = 100 // Should be canvas size dependant
	this.maxProjectiles = 800 // 8 per player
	this.motherShips = []
}

Spacewar.menuState.prototype = {

	init : function() {
		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Entering **MENU** state");
		}
		

		this.createGameState();
		this.hideHTML();
	},

	preload : function() {
		// In case JOIN message from server failed, we force it
		if (typeof game.global.myPlayer.id == 'undefined') {
			if (game.global.DEBUG_MODE) {
				console.log("[DEBUG] Forcing joining server...");
			}
			
			
		}
		let message = {
			event : 'JOIN'
		}
		game.global.socket.send(JSON.stringify(message))

		//Cargar botones de naves madre
		this.motherShips[0] = game.add.sprite(0, 0, 'spacewar','large_orange.png');
		this.motherShips[0].id = 0;
		this.motherShips[1] = game.add.sprite(870, 0, 'spacewar','large_purple.png');
		this.motherShips[1].id = 1;
		this.motherShips[2] = game.add.sprite(440, 470, 'spacewar','large_green.png');
		this.motherShips[2].id = 2;
	

		this.game.physics.arcade.enable(this.motherShips);
		this.game.physics.arcade.enable(game.global.projectiles);
	},

	create : function() {

		//Local bullets
		this.bullets = this.game.add.group(); 
		this.bullets.enableBody = true;
   		this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
		this.bullets.createMultiple(50, 'spacewar',['projectile.png']);
		this.bullets.setAll('anchor.x', 0);
		this.bullets.setAll('anchor.y', 0.5);
    	this.bullets.setAll('checkWorldBounds', true);
		this.bullets.setAll('outOfBoundsKill', true);	

		//Disparar
		this.fireRate = 100;
		this.nextFire = 0;
		this.keys =  {										
			shot: this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)	
		}

		//Textos 
		this.createRoomText = this.game.add.text(5, 110, "CREATE ROOM", { font: "25px Chakra Petch", fill: "#0a2239", align: "center" });
		this.createRoomText = this.game.add.text(860, 110, "JOIN ROOM", { font: "25px Chakra Petch", fill: "#0a2239", align: "center" });
		this.createRoomText = this.game.add.text(440, 430, "JOIN A GAME", { font: "25px Chakra Petch", fill: "#0a2239", align: "center" });

		this.shots = [];
		this.actualShot = 0;


	},

	update : function() {
		this.sendPlayerInfo();
		if (typeof game.global.myPlayer.id !== 'undefined') {
			//game.state.start('lobbyState')
		}

		if(this.keys.shot.isDown){
			this.fire();
		}

		this.game.physics.arcade.overlap(this.shots, this.motherShips, this.resolverColision,null,this);	
		
		game.global.myPlayer.textoNombre.setText(game.global.myPlayer.PlayerNombre);
		game.global.myPlayer.textoNombre.position.x = game.global.myPlayer.image.x;
		game.global.myPlayer.textoNombre.position.y = game.global.myPlayer.image.y;
	},

	fire: function(){

		var speed = 10;
		if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0)
   		{
			this.nextFire = this.game.time.now + this.fireRate;

			this.shots[this.actualShot] = this.bullets.getFirstDead();

			x = game.global.myPlayer.image.position.x + (30 * Math.cos(game.global.myPlayer.image.rotation));
			y = game.global.myPlayer.image.position.y + (30 * Math.sin(game.global.myPlayer.image.rotation));
			this.shots[this.actualShot].position.x = x;
			this.shots[this.actualShot].position.y = y;
			this.shots[this.actualShot].rotation = this.game.physics.arcade.angleBetween(game.global.myPlayer.image, this.shots[this.actualShot]);	
			
			this.shots[this.actualShot].reset(x, y);
			this.shots[this.actualShot].body.velocity.setToPolar(game.global.myPlayer.image.rotation,450);
			//this.game.physics.arcade.moveToPointer(this.shots[this.actualShot], 100);

		}
		this.actualShot++;
		if(this.actualShot > 50){
			this.actualShot=0;
		}

	},

	resolverColision: function(proyectile,motherShip){
		switch(motherShip.id){
			case 0:
				game.state.start('lobbyState')
				break;
			case 1:
				game.state.start('roomState')
				break;
			case 2:
				game.state.start('matchmakingState')
				break;
		}
	},

	sendPlayerInfo: function(){
		//DAAAAAAAAAAAAAAAAAANIIIIIIIIIIIIIIIIII
		let msg = new Object()
		msg.event = 'UPDATE MOVEMENT'

		msg.movement = {
			thrust : false,
			brake : false,
			rotLeft : false,
			rotRight : false
		}

		msg.bullet = false

		if (this.wKey.isDown)
			msg.movement.thrust = true;
		if (this.sKey.isDown)
			msg.movement.brake = true;
		if (this.aKey.isDown)
			msg.movement.rotLeft = true;
		if (this.dKey.isDown)
			msg.movement.rotRight = true;
		if (this.spaceKey.isDown) {
			//msg.bullet = this.fireBullet()
		}

		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Sending UPDATE MOVEMENT message to server")
		}
		game.global.socket.send(JSON.stringify(msg))
	},

	createGameState: function(){
		//DAAAAAAAAAAAAAAAAAANIIIIIIIIIIIIIIIIII
		// We create a procedural starfield background
		for (var i = 0; i < this.numStars; i++) {
			let sprite = game.add.sprite(game.world.randomX,
					game.world.randomY, 'spacewar', 'staralpha.png');
			let random = game.rnd.realInRange(0, 0.6);
			sprite.scale.setTo(random, random)
		}

		// We preload the bullets pool
		game.global.proyectiles = new Array(this.maxProjectiles)
		for (var i = 0; i < this.maxProjectiles; i++) {
			game.global.projectiles[i] = {
				image : game.add.sprite(0, 0, 'spacewar', 'projectile.png')
			}
			game.global.projectiles[i].image.anchor.setTo(0.5, 0.5)
			game.global.projectiles[i].image.visible = false
		}
		

		// we load a random ship
		let random = [ 'blue', 'darkgrey', 'green', 'metalic', 'orange',
				'purple', 'red' ]
		let randomImage = random[Math.floor(Math.random() * random.length)]
				+ '_0' + (Math.floor(Math.random() * 6) + 1) + '.png'
		game.global.myPlayer.image = game.add.sprite(0, 0, 'spacewar',
				game.global.myPlayer.shipType)
		game.global.myPlayer.image.anchor.setTo(0.5, 0.5)
		
		
		game.global.myPlayer.textoNombre = this.game.add.text(game.global.myPlayer.image.x, game.global.myPlayer.image.y + 20, game.global.myPlayer.PlayerNombre, { font: "20px Chakra Petch", fill: "#0a2239", align: "center" });
		game.global.myPlayer.textoNombre.anchor.setTo(0.5, 0.5);

		//DAAAAAAAAAAAAAAAAAANIIIIIIIIIIIIIIIIII
		this.bulletTime = 0
		this.fireBullet = function() {
			if (game.time.now > this.bulletTime) {
				this.bulletTime = game.time.now + 250;
				// this.weapon.fire()
				return true
			} else {
				return false
			}
		}

		this.wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
		this.sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
		this.aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
		this.dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
		this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

		// Stop the following keys from propagating up to the browser
		game.input.keyboard.addKeyCapture([ Phaser.Keyboard.W,
				Phaser.Keyboard.S, Phaser.Keyboard.A, Phaser.Keyboard.D,
				Phaser.Keyboard.SPACEBAR ]);

		game.camera.follow(game.global.myPlayer.image);

	},
	hideHTML: function(){
		document.getElementById("enterPlayerName").style.display = "none";
		document.getElementById("confirmPlayerName").style.display = "none";
		
		document.getElementById("RoomName").style.display = "none";
		document.getElementById("RoomGamemode").style.display = "none";
		document.getElementById("RoomMaxPlayers").style.display = "none";
		document.getElementById("RoomCreate").style.display = "none";

		document.getElementById("RoomNameSearch").style.display = "none";
		document.getElementById("RoomJoin").style.display = "none";

		document.getElementById("startGame").style.display = "none";
	}

}
Spacewar.gameState = function(game) {
	this.bulletTime
	this.fireBullet
	this.numStars = 100 // Should be canvas size dependant
	this.maxProjectiles = 800 // 8 per player
	this.maxAmmo = 10
	this.reloadTimer;	
	this.reloadText;
	this.propulsionTime;
	this.maxPropulsor = 20;
	
}

Spacewar.gameState.prototype = {

	init : function() {
		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Entering **GAME** state");
		}
		for (i = 0;i < game.global.otherPlayers.length;i++){
			//delete game.global.otherPlayers[i].healthBar;
			//delete game.global.otherPlayers[i].redHealthBar;
			delete game.global.otherPlayers[i];
		}
		
		this.reloadTimer = game.time.create(false)
		this.reloadTimer.add(1000, this.reloadMethod, this);
		this.reloadTimer.start();
		this.reloadTimer.pause();

		this.reloadPropulsorTimer = game.time.create(false)
		this.reloadPropulsorTimer.add(5000, this.reloadPropulsorMethod, this);
		this.reloadPropulsorTimer.start();
		this.reloadPropulsorTimer.pause();

		this.reloadText = this.game.add.text( 100 , this.game.height - 100,game.global.myPlayer.ammo + "/" + this.maxAmmo, { font: "40px Chakra Petch", fill: "#ffffff", align: "center" });
		this.reloadText.anchor.setTo(0.5, 0.5);
		this.reloadText.fixedToCamera = true;

		Spacewar.gameState.rondasText = this.game.add.text(this.game.width/2, 30,"", { font: "40px Chakra Petch", fill: "#ffffff", align: "center" });
		Spacewar.gameState.rondasText.anchor.setTo(0.5, 0.5);
		Spacewar.gameState.rondasText.fixedToCamera = true;

		this.propulsionText = this.game.add.text(700 , this.game.height - 100 ,game.global.myPlayer.actualPropulsor + "/" + this.maxPropulsor, { font: "40px Chakra Petch", fill: "#ffffff", align: "center" });
		this.propulsionText.anchor.setTo(0.5, 0.5);
		this.propulsionText.fixedToCamera = true;

		this.initMyPlayer();

		this.hideHTML();
	},

	initMyPlayer: function(){
		//Delete name text
		game.global.myPlayer.winner = false;
		game.global.myPlayer.ammo = this.maxAmmo;
		game.global.myPlayer.reloading = false;
		game.global.myPlayer.actualPropulsor = this.maxPropulsor;
		game.global.myPlayer.reloadingPropulsor = false;
		delete game.global.myPlayer.textoNombre;
		delete game.global.myPlayer.healthBar;
		delete game.global.myPlayer.redHealthBar;

	},

	reloadMethod: function(){
		game.global.myPlayer.ammo = this.maxAmmo; 
		this.reloadTimer.pause();
		this.reloadTimer.add(2000, this.reloadMethod, this);
		game.global.myPlayer.reloading = false;
	},

	reloadPropulsorMethod: function(){
		game.global.myPlayer.actualPropulsor = this.maxPropulsor; 
		this.reloadPropulsorTimer.pause();
		this.reloadPropulsorTimer.add(5000, this.reloadPropulsorMethod, this);
		game.global.myPlayer.reloadingPropulsor = false;
	},

	updateHealthBarOtherPlayer: function(player){
		player.healthBar.width = (game.global.maxAnchoBarraVidaOtherPlayer * player.vida) / game.global.vidaMax;
	},

	updateHealthBar: function(player){
		player.healthBar.width = (game.global.maxAnchoBarraVida * player.vida) / game.global.vidaMax;
	},

	preload : function() {
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
		game.global.myPlayer.image = game.add.sprite(0, 0, 'spacewar', game.global.myPlayer.shipType)
		game.global.myPlayer.image.anchor.setTo(0.5, 0.5)
	},

	create : function() {
		this.bulletTime = 0
		this.fireBullet = function() {
			if (game.time.now > this.bulletTime) {
				this.bulletTime = game.time.now + 250;
				game.global.myPlayer.ammo -= 1;
				// this.weapon.fire()
				return true
			} else {
				return false
			}
		}

		this.propulsionTime = 0;
		this.firePropulsor = function(){
			if (game.time.now > this.propulsionTime) {
				this.propulsionTime = game.time.now + 100;
				game.global.myPlayer.actualPropulsor -= 1;
				// this.weapon.fire()
				return true
			} else{
				return false
			}
		}

		this.wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
		this.sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
		this.aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
		this.dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
		this.rKey = game.input.keyboard.addKey(Phaser.Keyboard.R);
		this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.shiftKey = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);

		// Stop the following keys from propagating up to the browser
		game.input.keyboard.addKeyCapture([ Phaser.Keyboard.W,
				Phaser.Keyboard.S, Phaser.Keyboard.A, Phaser.Keyboard.D,
				Phaser.Keyboard.SPACEBAR, Phaser.Keyboard.R,Phaser.Keyboard.SHIFT]);

		game.camera.follow(game.global.myPlayer.image);
	},



	update : function() {
		let msg = new Object()
		msg.event = 'UPDATE MOVEMENT'

		msg.movement = {
			thrust : false,
			brake : false,
			rotLeft : false,
			rotRight : false,

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
		if (this.spaceKey.isDown && !game.global.myPlayer.reloading) {
			msg.bullet = this.fireBullet();
			if(game.global.myPlayer.ammo <= 0){
				game.global.myPlayer.reloading = true;
				this.reloadTimer.resume();
			} 
			
		}

		if (this.rKey.isDown){
			game.global.myPlayer.reloading = true;
			this.reloadTimer.resume();
		}

		
	if (this.shiftKey.isDown && !game.global.myPlayer.reloadingPropulsor) {
			if(this.firePropulsor()){
				msg.propulsion = 1.5;
				
			}else{
				msg.propulsion = 0;
			}
			if(game.global.myPlayer.actualPropulsor <= 0){
				game.global.myPlayer.reloadingPropulsor = true;
				this.reloadPropulsorTimer.resume();
			} 
			
	}
	
	

		if(!game.global.myPlayer.reloading){
			this.reloadText.setText(game.global.myPlayer.ammo + "/" + this.maxAmmo)
		}else{
			this.reloadText.setText("Reloading")
		}

		if(!game.global.myPlayer.reloadingPropulsor){
			this.propulsionText.setText(game.global.myPlayer.actualPropulsor + "/" + this.maxPropulsor);
		}else{
			this.propulsionText.setText("Reloading propulsion")
		}

		

		if (game.global.DEBUG_MODE) {
			console.log("[DEBUG] Sending UPDATE MOVEMENT message to server")
		}
		game.global.socket.send(JSON.stringify(msg))
	},

	hideHTML: function(){
		document.getElementById("RoomNameSearch").style.display = "none";
		document.getElementById("RoomJoin").style.display = "none";

		document.getElementById("startGame").style.display = "none";
	}
}
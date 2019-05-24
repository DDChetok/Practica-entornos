package spacewar;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.web.socket.TextMessage;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class SpacewarGame {

	public final static SpacewarGame INSTANCE = new SpacewarGame();

	private final static int FPS = 30;
	private final static long TICK_DELAY = 1000 / FPS;
	public final static boolean DEBUG_MODE = true;
	public final static boolean VERBOSE_MODE = true;

	ObjectMapper mapper = new ObjectMapper();
	private ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

	// GLOBAL GAME ROOM
	private Map<String, Player> players = new ConcurrentHashMap<>();
	//private Map<Integer, Projectile> projectiles = new ConcurrentHashMap<>();
	
	//Salas
	public ConcurrentMap<String,Room> roomMap = new ConcurrentHashMap<>();
	public Lock roomLock = new ReentrantLock();
	
	//Lock del json del tick
	public Lock tickLock = new ReentrantLock();
	
	public SpacewarGame() {
		Room menu = new Room("MENU","menu",50,-1);
		roomMap.put(menu.getRoomName(), menu);
	}

	public void addPlayer(Player player) {
		//players.put(player.getSession().getId(), player);
		roomLock.lock();
		Room room = roomMap.get(player.roomName);
		room.playersSet.put(player.getPlayerId(),player);
		room.puntuacionSet.put(player.getPlayerId(),player);
		int count = room.numPlayers.getAndIncrement();
		player.setVida(100);
		if (count >= 0) {
			this.startGameLoop();
		}
		roomLock.unlock();
	}

	public Collection<Player> getPlayers() {
		return players.values();
	}

	public void removePlayer(Player player) {
		roomLock.lock();
		Room room = roomMap.get(player.roomName);
		room.playersSet.remove(player.getPlayerId());
		int count = room.numPlayers.decrementAndGet();
		if (count == 0) {
			this.stopGameLoop();
		}
		roomLock.unlock();
	}

	public void startGameLoop() {
		scheduler = Executors.newScheduledThreadPool(1);
		scheduler.scheduleAtFixedRate(() -> tick(), TICK_DELAY, TICK_DELAY, TimeUnit.MILLISECONDS);
	}

	public void stopGameLoop() {
		if (scheduler != null) {
			scheduler.shutdown();
		}
	}

	public void broadcast(String message) {
		for(Room room : roomMap.values()) {
			for (Player player : room.playersSet.values()) {
				try {
					player.lock.lock();
					player.getSession().sendMessage(new TextMessage(message.toString()));
					player.lock.unlock();
				} catch (Throwable ex) {
					System.err.println("Execption sending message to player " + player.getSession().getId());
					ex.printStackTrace(System.err);
					this.removePlayer(player);
				}
			}
		}
	}

	private void tick() {
		

		long thisInstant = System.currentTimeMillis();
		Set<Integer> bullets2Remove = new HashSet<>();
		boolean removeBullets = false;
		
		try {
			tickLock.lock();
			for(Room room : roomMap.values()) {
				ObjectNode json = mapper.createObjectNode();
				ArrayNode arrayNodePlayers = mapper.createArrayNode();
				ArrayNode arrayNodeProjectiles = mapper.createArrayNode();
				ArrayNode arrayNodePuntuaciones = mapper.createArrayNode();
				// Update players
				for (Player player : room.playersSet.values()) {
					player.calculateMovement();
	
					ObjectNode jsonPlayer = mapper.createObjectNode();
					jsonPlayer.put("id", player.getPlayerId());
					jsonPlayer.put("shipType", player.getShipType());
					jsonPlayer.put("posX", player.getPosX());
					jsonPlayer.put("posY", player.getPosY());
					jsonPlayer.put("facingAngle", player.getFacingAngle());
					jsonPlayer.put("nombre", player.getNameRoom());
					jsonPlayer.put("PlayerNombre", player.getPlayerName());
					jsonPlayer.put("vida", player.getVida());
					jsonPlayer.put("puntuacion", player.getPuntuacion());
					arrayNodePlayers.addPOJO(jsonPlayer);   
				}
	
				// Update bullets and handle collision
				for (Projectile projectile : room.projectiles.values()) {
					projectile.applyVelocity2Position();
	
					// Handle collision
					for (Player player :  room.playersSet.values()) {
						if ((projectile.getOwner().getPlayerId() != player.getPlayerId()) && player.intersect(projectile)) {
							// System.out.println("Player " + player.getPlayerId() + " was hit!!!");
							projectile.setHit(true);
							player.setVida(player.getVida()-20);
							projectile.getOwner().setPuntuacion(projectile.getOwner().getPuntuacion()+50);
							break;
						}
					}
					
	
					ObjectNode jsonProjectile = mapper.createObjectNode();
					jsonProjectile.put("id", projectile.getId());
	
					if (!projectile.isHit() && projectile.isAlive(thisInstant)) {
						jsonProjectile.put("posX", projectile.getPosX());
						jsonProjectile.put("posY", projectile.getPosY());
						jsonProjectile.put("facingAngle", projectile.getFacingAngle());
						jsonProjectile.put("isAlive", true);
					} else {
						removeBullets = true;
						bullets2Remove.add(projectile.getId());
						jsonProjectile.put("isAlive", false);
						if (projectile.isHit()) {
							jsonProjectile.put("isHit", true);
							jsonProjectile.put("posX", projectile.getPosX());
							jsonProjectile.put("posY", projectile.getPosY());
						}
					}
					arrayNodeProjectiles.addPOJO(jsonProjectile);
				}
				
				for(Player puntuacion : room.puntuacionSet.values()) {
					
					ObjectNode jsonPuntuacion = mapper.createObjectNode();
					jsonPuntuacion.put("id", puntuacion.getPlayerId());
					jsonPuntuacion.put("nombre", puntuacion.getPlayerName());
					jsonPuntuacion.put("score", puntuacion.puntuacion);
					
					arrayNodePuntuaciones.addPOJO(jsonPuntuacion);
				}
	
				if (removeBullets)
					room.projectiles.keySet().removeAll(bullets2Remove);
	
				if(room.numPlayers.get() <= 1 && room.getRoomName() != "MENU" && room.puntuacionSet.size()>=2) {
					room.acabada = true;
				}
				json.put("room",room.getRoomName());
				json.put("acabada", room.acabada);
				json.put("event", "GAME STATE UPDATE");
				json.putPOJO("players", arrayNodePlayers);
				json.putPOJO("projectiles", arrayNodeProjectiles);
				json.putPOJO("puntuaciones", arrayNodePuntuaciones);
				
				this.broadcast(json.toString());
				
				
			}
			tickLock.unlock();
			
		}catch (Throwable ex) {

		}
	}

	public void handleCollision() {

	}
}

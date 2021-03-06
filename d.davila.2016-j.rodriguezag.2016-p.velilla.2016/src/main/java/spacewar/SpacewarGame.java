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
	
	public int maxX = 1024;
	public int maxY = 600;

	ObjectMapper mapper = new ObjectMapper();
	private ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

	//Salas
	public ConcurrentMap<String,Room> roomMap = new ConcurrentHashMap<>();
	public Lock roomLock = new ReentrantLock();
	
	//Lock del json del tick
	public Lock tickLock = new ReentrantLock();
	
	public SpacewarGame() {
		Room menu = new Room("MENU","menu",50,-1,50);
		roomMap.put(menu.getRoomName(), menu);
	}

	//Intoduce al jugador en la sala que tenga en su player.roomName
	public void addPlayer(Player player) {
		roomLock.lock();
		player.initSpaceship(500, 300, -90);
		Room room = roomMap.get(player.roomName);
		room.playersSet.put(player.getPlayerId(),player);
		room.puntuacionSet.put(player.getPlayerId(),player);
		room.numPlayers.getAndIncrement();
		player.setVida(100);
		player.rondasPerdidas = 0;
		roomLock.unlock();
	}

	//Borra al jugador de la sala en la que está y si la sala se queda vacía, se borra
	public void removePlayer(Player player) {
		roomLock.lock();
		Room room = roomMap.get(player.roomName);
		room.playersSet.remove(player.getPlayerId());
		int count = room.numPlayers.decrementAndGet();
		if(count <= 0 && room.getRoomName() != "MENU") {
			roomMap.remove(room.getRoomName());
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

	//Envia un mensaje a todos los jugadores de una misma sala
	public void broadcast(String message,String roomName) {
		Room r = roomMap.get(roomName);
			for (Player player : r.playersSet.values()) {
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
				ArrayNode arrayNodeRondas = mapper.createArrayNode();
				
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
				
				// Update players
				for (Player player : room.playersSet.values()) {
					player.lock.lock();
					player.calculateMovement();
					//Si te sales por un lado de la pantalla, entras por su contrario
					if(player.getPosX() < 0) {
						player.setPosition(maxX, player.getPosY());
					}
					if(player.getPosX() > maxX) {
						player.setPosition(0, player.getPosY());
					}
					if(player.getPosY() < 0) {
						player.setPosition(player.getPosX(),maxY);
					}
					if(player.getPosY() > maxY) {
						player.setPosition(player.getPosX(),0);
					}
					
					ObjectNode jsonPlayer = mapper.createObjectNode();
					jsonPlayer.put("id", player.getPlayerId());
					jsonPlayer.put("shipType", player.getShipType());
					jsonPlayer.put("posX", player.getPosX());
					jsonPlayer.put("posY", player.getPosY());
					jsonPlayer.put("facingAngle", player.getFacingAngle());
					jsonPlayer.put("nombre", player.getNameRoom());
					jsonPlayer.put("PlayerNombre", player.getPlayerName());
					jsonPlayer.put("vida", player.getVida());
					if(player.getVida() <= 0) {
						player.setVida(100);
					}
					jsonPlayer.put("puntuacion", player.getPuntuacion());
					jsonPlayer.put("rondasPerdidas",player.rondasPerdidas);
					arrayNodePlayers.addPOJO(jsonPlayer);   
					player.lock.unlock();
				}
	
				//Recoge las puntuaciones de los jugadores de la sala y lo añade al json
				for(Player puntuacion : room.puntuacionSet.values()) {
					ObjectNode jsonPlayerRondas = mapper.createObjectNode();
					jsonPlayerRondas.put("rondasPerdidas", puntuacion.rondasPerdidas);
					
					ObjectNode jsonPuntuacion = mapper.createObjectNode();
					jsonPuntuacion.put("id", puntuacion.getPlayerId());
					jsonPuntuacion.put("nombre", puntuacion.getPlayerName());
					jsonPuntuacion.put("score", puntuacion.puntuacion);
					
					arrayNodeRondas.addPOJO(jsonPlayerRondas);
					arrayNodePuntuaciones.addPOJO(jsonPuntuacion);
				}
	
				if (removeBullets)
					room.projectiles.keySet().removeAll(bullets2Remove);
	
				//Si queda un jugador, no estás en el menú y al menos ha habido 2 jugadores en la sala, se acaba la partida
				if(room.numPlayers.get() <= 1 && room.getRoomName() != "MENU" && room.puntuacionSet.size()>=2) {
					room.acabada = true;
				}
				
				json.put("numVivos",room.getNumPlayers().get());
				json.put("room",room.getRoomName());
				json.put("roomGamemode",room.getRoomGamemode());
				json.put("acabada", room.acabada);
				json.put("event", "GAME STATE UPDATE");
				json.putPOJO("players", arrayNodePlayers);
				json.putPOJO("projectiles", arrayNodeProjectiles);
				json.putPOJO("puntuaciones", arrayNodePuntuaciones);
				json.putPOJO("rondasPerdidasOtrosJugadores", arrayNodeRondas);
				this.broadcast(json.toString(),room.getRoomName());
				
				
			}
			tickLock.unlock();
			
		}catch (Throwable ex) {

		}
	}

	public void handleCollision() {

	}
}

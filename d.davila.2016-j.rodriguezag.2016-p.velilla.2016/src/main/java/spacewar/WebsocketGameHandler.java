package spacewar;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class WebsocketGameHandler extends TextWebSocketHandler {

	private SpacewarGame game = SpacewarGame.INSTANCE;
	private static final String PLAYER_ATTRIBUTE = "PLAYER";
	private ObjectMapper mapper = new ObjectMapper();
	private AtomicInteger playerId = new AtomicInteger(0);
	private AtomicInteger projectileId = new AtomicInteger(0);
	private Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		Player player = new Player(playerId.incrementAndGet(), session);
		session.getAttributes().put(PLAYER_ATTRIBUTE, player);
		sessions.put(session.getId(), session);
		
		ObjectNode msg = mapper.createObjectNode(); 
		msg.put("event", "JOIN");
		msg.put("id", player.getPlayerId());
		msg.put("shipType", player.getShipType());
		player.lock.lock();
		player.getSession().sendMessage(new TextMessage(msg.toString()));
		player.lock.unlock();
		
		player.roomName = "MENU";
		
		game.addPlayer(player);
		game.startGameLoop();
		
	}
	
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		Player player = (Player) session.getAttributes().get(PLAYER_ATTRIBUTE);
		player.lock.lock();
		sessions.remove(session.getId());
		game.removePlayer(player);

		ObjectNode msg = mapper.createObjectNode();
		msg.put("event", "REMOVE PLAYER");
		msg.put("id", player.getPlayerId());
		player.lock.unlock();
		game.broadcast(msg.toString(),player.getNameRoom());
		game.stopGameLoop();
	}
	
	static class ChatMessage {
		String name;
		String message;
		String event;
	}

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		try {			
			JsonNode node = mapper.readTree(message.getPayload());
			ObjectNode msg = mapper.createObjectNode();
			Player player = (Player) session.getAttributes().get(PLAYER_ATTRIBUTE);

			switch (node.get("event").asText()) {
			//Si se juega una partida classic, este mensaje indica que empieza una nueva ronda
			case "NEW_ROUND":
				game.roomLock.lock();
				player.lock.lock();
				player.rondasPerdidas += 1;	
				
				for(Player p : game.roomMap.get(player.getNameRoom()).playersSet.values()) {
					p.initSpaceship(500, 300, -90);
				}
				player.lock.unlock();
				game.roomLock.unlock();
				break;
			//Se busca si hay alguna sala disponible y si es verdad le une y le avisa de nuevo al cliente
			case "SEND_ROOM_REQUEST":
				player.lock.lock();
				game.roomLock.lock();
				boolean existe = false;
				for(Room r : game.roomMap.values()) {
					if(r.getRoomName() != "MENU" && (r.getNumPlayers().get() < r.getRoomMaxPlayers())) {
						game.removePlayer(player);
						player.roomName = r.getRoomName();
						game.addPlayer(player);
						existe = true;
						msg.put("roomName", r.getRoomName());
						msg.put("idHost", r.idHost);
						msg.put("roomGamemode",r.getRoomGamemode());
						break;
					}
				}
				
				msg.put("existe", existe);
				msg.put("event", "JOIN_ROOM_REQUEST");
				
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				game.roomLock.unlock();
				player.lock.unlock();
				break;
			//Cuando acaba la partida el servidor recibe un mensaje para restablecer la puntuacion del jugador
			case "RESET_SCORE":
				player.lock.lock();
					
				player.puntuacion=0;
				
				player.lock.unlock();
				break;
			//Cuando acaba la partida, se devuelve al jugador al menú
			case "ACABADA":
				player.lock.lock();
				if(player.getNameRoom() != "MENU") {
					game.roomMap.remove(player.getNameRoom());
					
					player.setNameRoom("MENU");
					
					game.addPlayer(player);
				}
				player.lock.unlock();
				break;
			//Cuando alguien muere, se le lleva al menú y se le devuelven al cliente las puntuaciones de la sala
			case "DESTRUIDO":
				player.lock.lock();
				msg.put("event", "REMOVE PLAYER");
				msg.put("id", player.getPlayerId());
				ArrayNode arrayPuntuaciones = mapper.createArrayNode();
				
				for(Player puntuacion : game.roomMap.get(player.getNameRoom()).puntuacionSet.values()) {
					
					ObjectNode jsonPuntuacion = mapper.createObjectNode();
					jsonPuntuacion.put("id", puntuacion.getPlayerId());
					jsonPuntuacion.put("nombre", puntuacion.getPlayerName());
					jsonPuntuacion.put("score", puntuacion.puntuacion);
					
					arrayPuntuaciones.addPOJO(jsonPuntuacion);
				}
				msg.putPOJO("score", arrayPuntuaciones);
				String salaAntigua = player.getNameRoom();
				game.removePlayer(player);
				player.roomName = node.get("room").asText();
				game.addPlayer(player);
				game.broadcast(msg.toString(),salaAntigua);
				player.lock.unlock();
				break;
			//Une al jugador a una sala si existe y le devuelve una respuesta
			case "JOIN_ROOM_REQUEST":
				game.roomLock.lock();
				String roomNameJoin = node.get("roomName").asText();
				if(game.roomMap.containsKey(roomNameJoin) && !game.roomMap.get(roomNameJoin).ready){ //Si existe la sala
					
					//Eliminamos al jugador de la sala en la que estaba
					game.removePlayer(player);
					msg.put("roomName", roomNameJoin);
					msg.put("roomGamemode",game.roomMap.get(roomNameJoin).getRoomGamemode());
					msg.put("existe", true);
					Room roomJoin = game.roomMap.get(roomNameJoin);
					player.roomName = roomNameJoin;
					game.addPlayer(player);
					msg.put("idHost", roomJoin.idHost);
					
				}else { //Si no existe la sala
					msg.put("existe", false);
				}
				
				msg.put("event", "JOIN_ROOM_REQUEST");
				player.lock.lock();
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				player.lock.unlock();
				game.roomLock.unlock();
				break;
			//Indica que la partida ya ha comenzado. El cliente servidor recibe este mensaje si el host de la sala quiere iniciar partida con menos jugadores de los indicados
			case "ROOM_READY":
				player.lock.lock();
				Room room = game.roomMap.get(player.getNameRoom());
				if(room.numPlayers.get() >= 2) {
					room.ready = node.get("ready").asBoolean();
				}
				player.lock.unlock();
				break;
				
			//Comprueba si se puede empezar la partida o no y devuelve una respuesta
			case "CHECK_ESTADO":
				game.roomLock.lock();
				String roomName = node.get("roomName").asText();
				
				Room room_1 = game.roomMap.get(roomName);
			
				msg.put("event","CHECK_ESTADO");
				if(room_1.numPlayers.get() >= room_1.getRoomMaxPlayers()) {
					room_1.ready = true;
				}
				msg.put("numJugadores",room_1.numPlayers.get());
				msg.put("ready",room_1.ready);
				player.lock.lock();
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				player.lock.unlock();
				
				game.roomLock.unlock();
				break;
			
			//Recibe y envia a los jugadores de la misma sala un mensaje de chat
			case "CHAT":
				msg.put("event", "CHAT");
				msg.put("name", node.get("name").asText());
				msg.put("message", node.get("message").asText());
				game.broadcast(msg.toString(), player.getNameRoom());
				break;
				
			//Crea una sala si no existe otra sala con ese nombre. Envía una respuesta al cliente.
			case "CREATE_ROOM_REQUEST":
				game.roomLock.lock();
				int numRondas;
				if(node.get("roomGamemode").asText() == "classic") {
					numRondas = 3;
				}else {
					numRondas = 1;
				}
				Room room1 = new Room(node.get("roomName").asText(),node.get("roomGamemode").asText(),node.get("roomMaxPlayers").asInt(),player.getPlayerId(),numRondas);
				Room room2 = game.roomMap.putIfAbsent(room1.getRoomName(), room1);
				msg.put("event","CREATE_ROOM_REQUEST");
				msg.put("roomName",room1.getRoomName());
				msg.put("roomGamemode",room1.getRoomGamemode());
				msg.put("roomMaxPlayers",room1.getRoomMaxPlayers());
				
				if(room2 != null && room1.areEquals(room2)) { //Si son iguales, no se inserta
					msg.put("salaCreada", false);
					
				}else { //Si se ha insertado correctamente
					//Eliminamos al jugador de la sala en la que estaba
					msg.put("salaCreada", true);
					room1.idHost = player.getPlayerId();
					msg.put("idHost", room1.idHost);
					//Creamos un nuevo mensaje con la informacion del jugador que se ha ido de la sala para que no nos pinte
					ObjectNode msg2 = mapper.createObjectNode();
					msg2.put("event", "REMOVE PLAYER");
					msg2.put("id", player.getPlayerId());
					
					game.broadcast(msg2.toString(),player.getNameRoom());	
					game.removePlayer(player);
					player.roomName = room1.getRoomName();
					game.addPlayer(player);
				}
				player.lock.lock();
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				player.lock.unlock();
				game.roomLock.unlock();
				break;
			
			//Da el nombre al jugador
			case "ADD_PLAYER_NAME_REQUEST":
				player.setPlayerName(node.get("playername").asText());
				break;	
			
			//Conectar el jugador al juego. Le mete en la sala menú.
			case "JOIN":
				msg.put("event", "JOIN");
				msg.put("id", player.getPlayerId());
				msg.put("shipType", player.getShipType());
				msg.put("roomName", "MENU");
				msg.put("vida", player.getVida());
				player.lock.lock();
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				player.lock.unlock();
				break;
				
			//Actualiza al jugador
			case "UPDATE MOVEMENT":
				player.propulsion = node.path("propulsion").asDouble();
				player.loadMovement(node.path("movement").get("thrust").asBoolean(),
						node.path("movement").get("brake").asBoolean(),
						node.path("movement").get("rotLeft").asBoolean(),
						node.path("movement").get("rotRight").asBoolean());
				if (node.path("bullet").asBoolean()) {
					Projectile projectile = new Projectile(player, this.projectileId.incrementAndGet());
					game.roomMap.get(player.roomName).addProjectile(projectile.getId(), projectile); //////////////////////////
				}
				break;
			default:
				break;
			}

		} catch (Exception e) {
			System.err.println("Exception processing message " + message.getPayload());
			e.printStackTrace(System.err);
		}
	}

}

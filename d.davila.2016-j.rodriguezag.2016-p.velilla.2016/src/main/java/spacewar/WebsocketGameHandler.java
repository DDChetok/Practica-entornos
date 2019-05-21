package spacewar;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class WebsocketGameHandler extends TextWebSocketHandler {

	private SpacewarGame game = SpacewarGame.INSTANCE;
	private static final String PLAYER_ATTRIBUTE = "PLAYER";
	private ObjectMapper mapper = new ObjectMapper();
	private AtomicInteger playerId = new AtomicInteger(0);
	private AtomicInteger projectileId = new AtomicInteger(0);
	
	//Chat
	private Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
	private ObjectMapper json = new ObjectMapper().setVisibility(PropertyAccessor.FIELD, Visibility.ANY);
	
	

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		Player player = new Player(playerId.incrementAndGet(), session);
		session.getAttributes().put(PLAYER_ATTRIBUTE, player);
		sessions.put(session.getId(), session);
		
		ObjectNode msg = mapper.createObjectNode(); 
		msg.put("event", "JOIN");
		msg.put("id", player.getPlayerId());
		msg.put("shipType", player.getShipType());
		player.getSession().sendMessage(new TextMessage(msg.toString()));
		
		player.roomName = "MENU";
		
		game.addPlayer(player);
	}
	
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		Player player = (Player) session.getAttributes().get(PLAYER_ATTRIBUTE);
		sessions.remove(session.getId());
		game.removePlayer(player);

		ObjectNode msg = mapper.createObjectNode();
		msg.put("event", "REMOVE PLAYER");
		msg.put("id", player.getPlayerId());
		game.broadcast(msg.toString());
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
			case "JOIN_ROOM_REQUEST":
				String roomNameJoin = node.get("roomName").asText();
				if(game.roomMap.containsKey(roomNameJoin)) { //Si existe la sala
					msg.put("roomName", roomNameJoin);
					msg.put("existe", true);
					Room roomJoin = game.roomMap.get(roomNameJoin);
					roomJoin.playersSet.put(player.getPlayerId(),player);
					player.roomName = roomNameJoin;
				}else { //Si no existe la sala
					msg.put("existe", false);
				}
				msg.put("event", "JOIN_ROOM_REQUEST");
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				break;
			case "CHECK_ESTADO":
				String roomName = node.get("roomName").asText();
				Room room_1 = game.roomMap.get(roomName);
				int numJugadores = room_1.playersSet.size();
				
				msg.put("event","CHECK_ESTADO");
				msg.put("numJugadores",numJugadores);
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				break;
			case "CHAT":
				//chat
				System.out.println("Message received: " + message.getPayload());
				ChatMessage mensaje = json.readValue(message.getPayload(), ChatMessage.class);
				
				sendOtherParticipants(session, mensaje);
				break;
			
			case "CREATE_ROOM_REQUEST":
				Room room = new Room(node.get("roomName").asText(),node.get("roomGamemode").asText(),node.get("roomMaxPlayers").asInt());
				Room room2 = game.roomMap.putIfAbsent(room.getRoomName(), room);
				msg.put("event","CREATE_ROOM_REQUEST");
				msg.put("roomName",room.getRoomName());
				msg.put("roomGamemode",room.getRoomGamemode());
				msg.put("roomMaxPlayers",room.getRoomMaxPlayers());
				if(room2 != null && room.areEquals(room2)) { //Si son iguales, no se inserta
					msg.put("salaCreada", false);
					
				}else { //Si se ha insertado correctamente
					msg.put("salaCreada", true);
					room.playersSet.put(player.getPlayerId(),player);
					player.roomName = room.getRoomName();
				}
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				break;
				
			case "JOIN":
				msg.put("event", "JOIN");
				msg.put("id", player.getPlayerId());
				msg.put("shipType", player.getShipType());
				msg.put("roomName", "MENU");
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				break;
			case "UPDATE MOVEMENT":
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

	private void sendOtherParticipants(WebSocketSession session, ChatMessage msg) throws IOException {

		String jsonMsg = json.writeValueAsString(msg);
		
		System.out.println("Message sent: " + jsonMsg);
				
		for(WebSocketSession participant : sessions.values()) {
			if(!participant.getId().equals(session.getId())) {
				participant.sendMessage(new TextMessage(jsonMsg));
			}
		}
	}
}

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
	
	//Salas
	private ConcurrentMap<String,Room> roomMap = new ConcurrentHashMap<>();

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
			case "CHAT":
				//chat
				System.out.println("Message received: " + message.getPayload());
				ChatMessage mensaje = json.readValue(message.getPayload(), ChatMessage.class);
				
				sendOtherParticipants(session, mensaje);
				break;
			
			case "CREATE_ROOM_REQUEST":
				Room room = new Room(node.get("roomName").asText(),node.get("roomGamemode").asText(),node.get("roomMaxPlayers").asInt());
				Room room2 = roomMap.putIfAbsent(room.getRoomName(), room);
				if(room2 != null && room.areEquals(room2)) {
					game.broadcast("Y existe una sala con ese nombre");
				}
				game.broadcast(node.toString());
				break;
			case "JOIN":
				msg.put("event", "JOIN");
				msg.put("id", player.getPlayerId());
				msg.put("shipType", player.getShipType());
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				break;
			case "JOIN ROOM":
				msg.put("event", "JOIN ROOM");
				msg.put("room", "GLOBAL");
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				break;
			case "CREATE ROOM":
				msg.put("event", "NEW ROOM");
				msg.put("room", "sala");
				SalaActual.incrementAndGet();
				player.getSession().sendMessage(new TextMessage(msg.toString()));
				break;
			case "UPDATE MOVEMENT":
				player.loadMovement(node.path("movement").get("thrust").asBoolean(),
						node.path("movement").get("brake").asBoolean(),
						node.path("movement").get("rotLeft").asBoolean(),
						node.path("movement").get("rotRight").asBoolean());
				if (node.path("bullet").asBoolean()) {
					Projectile projectile = new Projectile(player, this.projectileId.incrementAndGet());
					game.addProjectile(projectile.getId(), projectile);
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

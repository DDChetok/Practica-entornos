package spacewar;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;

public class Room {
	private String roomName;
	private String roomGamemode;
	private int roomMaxPlayers;
	public ConcurrentMap<Integer,Player> playersSet; //Hemos usado un concurrent map como un conjunto concurrente
	
	public Room(String roomName, String roomGamemode, int roomMaxPlayers) {
		super();
		this.roomName = roomName;
		this.roomGamemode = roomGamemode;
		this.roomMaxPlayers = roomMaxPlayers;
		this.playersSet = new ConcurrentHashMap<Integer,Player>();
	}

	@Override
	public String toString() {
		return "Room [roomName=" + roomName + ", roomGamemode=" + roomGamemode + ", roomMaxPlayers=" + roomMaxPlayers
				+ "]";
	}


	public String getRoomName() {
		return roomName;
	}

	public String getRoomGamemode() {
		return roomGamemode;
	}

	public int getRoomMaxPlayers() {
		return roomMaxPlayers;
	}
	
	public boolean areEquals(Room r2) {
		return ((Objects.equals(getRoomName(), r2.getRoomName())) && (Objects.equals(getRoomGamemode(), r2.getRoomGamemode())) && (getRoomMaxPlayers() == r2.getRoomMaxPlayers()));
	}
	
	
	
}

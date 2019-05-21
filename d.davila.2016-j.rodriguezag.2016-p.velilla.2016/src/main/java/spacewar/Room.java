package spacewar;

import java.util.Objects;

public class Room {
	private String roomName;
	private String roomGamemode;
	private int roomMaxPlayers;
	
	public Room(String roomName, String roomGamemode, int roomMaxPlayers) {
		super();
		this.roomName = roomName;
		this.roomGamemode = roomGamemode;
		this.roomMaxPlayers = roomMaxPlayers;
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

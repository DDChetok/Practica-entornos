package spacewar;

import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class Room {
	private String roomName;
	private String roomGamemode;
	private int roomMaxPlayers;
	public ConcurrentMap<Integer,Player> playersSet; //Hemos usado un concurrent map como un conjunto concurrente
	public Map<Integer, Projectile> projectiles = new ConcurrentHashMap<>();
	//public ConcurrentMap<Integer,Player> playersSet;
	public AtomicInteger numPlayers = new AtomicInteger();
	public int idHost;
	public boolean ready;
	public boolean acabada;
	public ConcurrentMap<Integer,Player> puntuacionSet;
	public int rondasMaximas;
	
	public Room(String roomName, String roomGamemode, int roomMaxPlayers,int idHost,int rondasMaximas) {
		super();
		this.roomName = roomName;
		this.roomGamemode = roomGamemode;
		this.roomMaxPlayers = roomMaxPlayers;
		this.playersSet = new ConcurrentHashMap<Integer,Player>();
		this.idHost = idHost;
		this.ready = false;
		this.acabada = false;
		this.puntuacionSet = new ConcurrentHashMap<Integer,Player>();
		this.rondasMaximas = rondasMaximas;
	}

	@Override
	public String toString() {
		return "Room [roomName=" + roomName + ", roomGamemode=" + roomGamemode + ", roomMaxPlayers=" + roomMaxPlayers
				+ "]";
	}
	
	public AtomicInteger getNumPlayers() {
		return numPlayers;
	}

	public void setNumPlayers(AtomicInteger numPlayers) {
		this.numPlayers = numPlayers;
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
		return (Objects.equals(getRoomName(), r2.getRoomName()));
	}
	
	public void addProjectile(int id, Projectile projectile) {
		projectiles.put(id, projectile);
	}
	
	public Collection<Projectile> getProjectiles() {
		return projectiles.values();
	}
	
	public void removeProjectile(Projectile projectile) {
		projectiles.remove(projectile.getId(), projectile);
	}
	
}

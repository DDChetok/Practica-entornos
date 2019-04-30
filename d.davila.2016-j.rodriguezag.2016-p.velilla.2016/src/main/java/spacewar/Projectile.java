package spacewar;

public class Projectile extends SpaceObject {

	private static final int LIFESPAN = 2000;
	private static final double PROJECTILE_SPEED = 25;
	private static final int PROJECTILE_COLLISION_FACTOR = 200;

	private final Player owner;
	private final long firingInstant;
	private final int id;

	private boolean isHit = false;

	public Projectile(Player owner, int id) {
		this.setCollisionFactor(PROJECTILE_COLLISION_FACTOR);
		this.owner = owner;
		this.firingInstant = System.currentTimeMillis();
		this.initProjectile();
		this.id = id % 800; // 800 = maxNumProjectiles
	}

	public Player getOwner() {
		return this.owner;
	}

	public static int getLifespan() {
		return LIFESPAN;
	}

	public int getId() {
		return id;
	}

	public boolean isAlive(long thisInstant) {
		return (thisInstant < (this.firingInstant + LIFESPAN));
	}

	public boolean isHit() {
		return isHit;
	}

	public void setHit(boolean isHit) {
		this.isHit = isHit;
	}

	public void initProjectile() {
		this.setPosition(this.owner.getPosX(), this.owner.getPosY());
		this.setFacingAngle(owner.getFacingAngle());
		this.setVelocity(Math.cos(this.getFacingAngle() * Math.PI / 180) * PROJECTILE_SPEED,
				Math.sin(this.getFacingAngle() * Math.PI / 180) * PROJECTILE_SPEED);
	}

}

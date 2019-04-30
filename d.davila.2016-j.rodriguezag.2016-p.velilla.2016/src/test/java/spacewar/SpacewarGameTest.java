package spacewar;

import static org.junit.Assert.assertTrue;

import java.util.concurrent.atomic.AtomicReference;

import org.junit.BeforeClass;
import org.junit.Test;

public class SpacewarGameTest {

	@BeforeClass
	public static void startServer() {
		Application.main(new String[] { "--server.port=9000" });
	}

	@Test
	public void testConnection() throws Exception {

		WebSocketClient ws = new WebSocketClient();
		ws.connect("ws://127.0.0.1:9000/spacewar");
		ws.disconnect();
	}

	@Test
	public void testJoin() throws Exception {

		AtomicReference<String> firstMsg = new AtomicReference<String>();

		WebSocketClient ws = new WebSocketClient();
		
		ws.onMessage((session, msg) -> {
			System.out.println("TestMessage: " + msg);
			firstMsg.compareAndSet(null, msg);
		});

		ws.connect("ws://127.0.0.1:9000/spacewar");
		System.out.println("Connected");
		Thread.sleep(1000);
		String msg = firstMsg.get();

		assertTrue("The fist message should contain 'join', but it is " + msg, msg.contains("JOIN"));
		ws.disconnect();
	}
}

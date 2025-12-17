from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Map slug -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, slug: str):
        await websocket.accept()
        if slug not in self.active_connections:
            self.active_connections[slug] = []
        self.active_connections[slug].append(websocket)

    def disconnect(self, websocket: WebSocket, slug: str):
        if slug in self.active_connections:
            if websocket in self.active_connections[slug]:
                self.active_connections[slug].remove(websocket)
            if not self.active_connections[slug]:
                del self.active_connections[slug]

    async def broadcast(self, message: dict, slug: str):
        if slug in self.active_connections:
            for connection in self.active_connections[slug]:
                await connection.send_json(message)

manager = ConnectionManager()

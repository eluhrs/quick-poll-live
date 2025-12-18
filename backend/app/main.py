import os
from fastapi import FastAPI, WebSocket as FastAPIWebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from . import models, database, auth
from .routers import polls
from .websockets import manager


models.Base.metadata.create_all(bind=database.engine)

# Docs disabled globally for security/audit compliance
app = FastAPI(title="Live Polling API", docs_url=None, redoc_url=None)

# Security: CORS restricted to allowed origins
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "https://livepoll.lehigh.edu,http://localhost:8081")
origins = allowed_origins_str.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(polls.router)

@app.websocket("/ws/{slug}")
async def websocket_endpoint(websocket: FastAPIWebSocket, slug: str):
    await manager.connect(websocket, slug)
    try:
        while True:
            await websocket.receive_text()
            # Optionally handle client messages
    except WebSocketDisconnect:
        manager.disconnect(websocket, slug)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}


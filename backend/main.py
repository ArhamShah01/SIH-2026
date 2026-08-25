from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import dashboard, incidents, trajectories, vessels, detection

app = FastAPI(
    title="OILWATCH AI Backend",
    description="Maritime oil spill detection and trajectory analysis API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(trajectories.router, prefix="/api")
app.include_router(vessels.router, prefix="/api")
app.include_router(detection.router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "online", "service": "OILWATCH AI Backend", "version": "0.1.0"}

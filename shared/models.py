"""Pydantic models that mirror shared/types.ts — import these in any Python consumer."""
from datetime import datetime
from pydantic import BaseModel


class SensorReadings(BaseModel):
    beltSpeed: float
    motorCurrent: float
    bearingTemp: list[float]
    vibrationRMS: list[float]
    tonnesPerHour: float
    alignmentDeviation: float


class TelemetryFrame(BaseModel):
    timestamp: datetime
    assetId: str
    sensors: SensorReadings

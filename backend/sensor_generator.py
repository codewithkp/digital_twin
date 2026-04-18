import random
from datetime import datetime, timezone
from typing import Literal

from models import SensorReadings, TelemetryFrame

ASSET_ID = "CONVEYOR-BELT-001"

FaultType = Literal["bearing", "alignment", "motor"] | None

NOMINAL = {
    "beltSpeed":          1.2,
    "motorCurrent":       65.0,
    "bearingTemp":        45.0,
    "vibrationRMS":       1.5,
    "tonnesPerHour":      950.0,
    "alignmentDeviation": 2.0,
}

NOISE = {
    "beltSpeed":          0.05,
    "motorCurrent":       2.0,
    "bearingTemp":        1.0,
    "vibrationRMS":       0.2,
    "tonnesPerHour":      20.0,
    "alignmentDeviation": 0.5,
}


def _noisy(nominal: float, noise: float) -> float:
    return nominal + random.gauss(0, noise)


def generate_frame(fault_type: FaultType = None, elapsed: float = 0.0) -> TelemetryFrame:
    belt_speed    = max(0.1, _noisy(NOMINAL["beltSpeed"],    NOISE["beltSpeed"]))
    motor_current = max(0.0, _noisy(NOMINAL["motorCurrent"], NOISE["motorCurrent"]))
    bearing_temps = [max(20.0, _noisy(NOMINAL["bearingTemp"],  NOISE["bearingTemp"])) for _ in range(4)]
    vibration_rms = [max(0.0,  _noisy(NOMINAL["vibrationRMS"], NOISE["vibrationRMS"])) for _ in range(4)]
    tonnes        = max(0.0, _noisy(NOMINAL["tonnesPerHour"],      NOISE["tonnesPerHour"]))
    alignment     = max(0.0, _noisy(NOMINAL["alignmentDeviation"], NOISE["alignmentDeviation"]))

    if fault_type == "bearing":
        # Ramp bearing 3 temp + vibration toward RED over ~30 s
        ramp = min(1.0, elapsed / 30)
        bearing_temps[2] *= 1 + ramp * 0.85   # → ~83 °C  (RED > 80)
        vibration_rms[2] *= 1 + ramp * 3.8    # → ~7.2 mm/s (RED > 7)
        motor_current    *= 1 + ramp * 0.22   # → ~79 A   (AMBER > 80)

    elif fault_type == "alignment":
        # Belt misalignment ramps to RED over ~20 s
        ramp = min(1.0, elapsed / 20)
        alignment        *= 1 + ramp * 9.0    # → ~20 mm  (RED > 15)
        vibration_rms[0] *= 1 + ramp * 1.5    # secondary effect

    elif fault_type == "motor":
        # Motor overload ramps toward RED over ~25 s, belt slows
        ramp = min(1.0, elapsed / 25)
        motor_current *= 1 + ramp * 0.55      # → ~101 A  (RED > 95)
        belt_speed    *= max(0.5, 1 - ramp * 0.35)
        tonnes        *= max(0.6, 1 - ramp * 0.25)

    return TelemetryFrame(
        timestamp=datetime.now(timezone.utc),
        assetId=ASSET_ID,
        sensors=SensorReadings(
            beltSpeed=round(belt_speed, 3),
            motorCurrent=round(motor_current, 2),
            bearingTemp=[round(t, 2) for t in bearing_temps],
            vibrationRMS=[round(v, 3) for v in vibration_rms],
            tonnesPerHour=round(tonnes, 1),
            alignmentDeviation=round(alignment, 2),
        ),
    )

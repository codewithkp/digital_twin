from enum import Enum


class HealthStatus(str, Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"


THRESHOLDS: dict[str, dict[str, float]] = {
    "beltSpeed":          {"amber": 1.5,  "red": 2.0},   # m/s
    "motorCurrent":       {"amber": 80.0, "red": 95.0},  # A
    "bearingTemp":        {"amber": 60.0, "red": 80.0},  # °C
    "vibrationRMS":       {"amber": 3.0,  "red": 7.0},   # mm/s
    "tonnesPerHour":      {"amber": 800.0, "red": 600.0},  # inverted – lower is worse
    "alignmentDeviation": {"amber": 5.0,  "red": 15.0},  # mm
}

_ORDER = [HealthStatus.GREEN, HealthStatus.AMBER, HealthStatus.RED]


def health_for_value(value: float, key: str, inverted: bool = False) -> HealthStatus:
    t = THRESHOLDS[key]
    if inverted:
        if value < t["red"]:
            return HealthStatus.RED
        if value < t["amber"]:
            return HealthStatus.AMBER
        return HealthStatus.GREEN
    if value >= t["red"]:
        return HealthStatus.RED
    if value >= t["amber"]:
        return HealthStatus.AMBER
    return HealthStatus.GREEN


def _worst(statuses: list[HealthStatus]) -> HealthStatus:
    return max(statuses, key=lambda s: _ORDER.index(s))


def health_score(sensors: dict) -> dict[str, HealthStatus]:
    return {
        "beltSpeed":          health_for_value(sensors["beltSpeed"], "beltSpeed"),
        "motorCurrent":       health_for_value(sensors["motorCurrent"], "motorCurrent"),
        "bearingTemp":        _worst([health_for_value(t, "bearingTemp") for t in sensors["bearingTemp"]]),
        "vibrationRMS":       _worst([health_for_value(v, "vibrationRMS") for v in sensors["vibrationRMS"]]),
        "tonnesPerHour":      health_for_value(sensors["tonnesPerHour"], "tonnesPerHour", inverted=True),
        "alignmentDeviation": health_for_value(sensors["alignmentDeviation"], "alignmentDeviation"),
    }

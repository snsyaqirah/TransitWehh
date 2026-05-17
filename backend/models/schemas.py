from datetime import date, timedelta
from typing import Literal, Annotated
from pydantic import BaseModel, Field, field_validator
from services.config import TRAINING_CUTOFF_MIN, training_cutoff_max

_SERVICE_PATTERN = r"^(rail_|bus_)[a-z_]+$"


class ForecastParams(BaseModel):
    horizon: Literal[30, 60, 90] = 30
    service: str = Field(..., pattern=_SERVICE_PATTERN)
    use_rain: bool = False
    training_cutoff: date = Field(default=date(2022, 7, 1))

    @field_validator("training_cutoff")
    @classmethod
    def validate_training_cutoff(cls, v: date) -> date:
        if v < TRAINING_CUTOFF_MIN:
            raise ValueError(
                f"training_cutoff must be >= {TRAINING_CUTOFF_MIN} (COVID data is structurally different)"
            )
        max_cutoff = training_cutoff_max()
        if v > max_cutoff:
            raise ValueError(
                f"training_cutoff must be <= {max_cutoff} (need at least 90 days of training data)"
            )
        return v


class AnomalyParams(BaseModel):
    method: Literal["iqr", "zscore"] = "iqr"
    service: str = Field(..., pattern=_SERVICE_PATTERN)
    date_gte: date | None = None
    date_lte: date | None = None


class BacktestParams(BaseModel):
    service: str = Field(..., pattern=_SERVICE_PATTERN)
    training_cutoff: date = Field(default=date(2022, 7, 1))

    @field_validator("training_cutoff")
    @classmethod
    def validate_training_cutoff(cls, v: date) -> date:
        if v < TRAINING_CUTOFF_MIN:
            raise ValueError(
                f"training_cutoff must be >= {TRAINING_CUTOFF_MIN}"
            )
        max_cutoff = training_cutoff_max()
        if v > max_cutoff:
            raise ValueError(
                f"training_cutoff must be <= {max_cutoff}"
            )
        return v


class DecomposeParams(BaseModel):
    service: str = Field(..., pattern=_SERVICE_PATTERN)
    period: Literal[7, 30, 365] = 365


class RainCorrelationParams(BaseModel):
    service: str = Field(..., pattern=_SERVICE_PATTERN)


class HeadlineParams(BaseModel):
    date_gte: date | None = None
    date_lte: date | None = None
    service: str | None = None

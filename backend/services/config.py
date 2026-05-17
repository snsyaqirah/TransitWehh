from datetime import date, timedelta

# === Training ===
# Post-COVID cutoff. Data before 2022-07 is structurally different (MCO suppression).
TRAINING_CUTOFF = date(2022, 7, 1)

# Hard floor for user-supplied training_cutoff — never allow COVID-era training via URL param
TRAINING_CUTOFF_MIN = date(2022, 1, 1)

# Must have at least 90 days of data before the cutoff
def training_cutoff_max() -> date:
    return date.today() - timedelta(days=90)

# === Null handling ===
# Forward-fill: brief outages are rare. Conservative — doesn't invent data, just carries last known.
NULL_STRATEGY = "forward_fill"

# === Rain ===
# KL "heavy rain" threshold per Malaysia Met Department definition
RAINY_DAY_THRESHOLD_MM = 10.0

# === Backtesting ===
BACKTEST_MONTHS = 12

# === Rolling average ===
# window // 2 avoids misleading averages at the start of a series launch
ROLLING_AVG_MIN_PERIODS = 4

# === Anomaly detection ===
# Tukey IQR fence multiplier (standard: 1.5)
ANOMALY_FENCE = 1.5
ZSCORE_THRESHOLD = 2.5

# === MAPE ===
# "floored": clips denominator to MIN_ACTUAL_FLOOR (avoids divide-by-near-zero on holidays/new services)
# "smape": symmetric MAPE — handles near-zero better but changes scale interpretation
MAPE_METHOD = "floored"
MIN_ACTUAL_FLOOR = 1000  # ridership floor for MAPE denominator

# === Event study ===
MRT_PJY_OPENING = date(2023, 3, 16)
EVENT_STUDY_WINDOW = 6  # months before/after

# === HTTP ===
HTTPX_TIMEOUT = 10.0    # seconds total
HTTPX_CONNECT_TIMEOUT = 5.0

# === Cache TTLs (seconds) ===
CACHE_TTL_RIDERSHIP = 300      # 5 min — daily data updates once/day but check often
CACHE_TTL_WEATHER = 86400      # 24h — historical weather is immutable
CACHE_TTL_BACKTEST = 43200     # 12h — Prophet results are expensive to recompute

# === Ridership index base dates ===
# MRT PJY opened 2023-03-16. First full month is April. Cannot normalize to Jan 2023.
# All other services use Jan 2023 as base.
INDEX_BASE_DATES: dict[str, str] = {
    "rail_mrt_pjy": "2023-04-01",
    "default": "2023-01-01",
}

# === Data source ===
DATA_GOV_MY_BASE = "https://api.data.gov.my/data-catalogue/"

EXPECTED_HEADLINE_COLUMNS = {
    "date", "bus_rkl", "bus_rkn", "bus_rpn",
    "rail_lrt_kj", "rail_lrt_ampang", "rail_mrt_kajang", "rail_mrt_pjy",
    "rail_monorail", "rail_komuter", "rail_komuter_utara",
    "rail_ets", "rail_tebrau", "rail_intercity",
}

# === Nowcast ===
# KL Sentral approximate capacity as rough ceiling for density calculation
NOWCAST_CAPACITY_BASELINE = 50000

# === Data freshness warning ===
DATA_FRESHNESS_WARNING_DAYS = 3

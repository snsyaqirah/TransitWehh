from datetime import date
import holidays as hdays

_MY_HOLIDAYS: dict[date, str] = {}


def _load_holidays(year: int) -> None:
    if year not in {d.year for d in _MY_HOLIDAYS}:
        _MY_HOLIDAYS.update(hdays.Malaysia(years=year))


def is_public_holiday(d: date) -> bool:
    _load_holidays(d.year)
    return d in _MY_HOLIDAYS


def get_holiday_name(d: date) -> str | None:
    _load_holidays(d.year)
    return _MY_HOLIDAYS.get(d)


def get_holidays_for_year(year: int) -> dict[str, str]:
    _load_holidays(year)
    return {d.isoformat(): name for d, name in _MY_HOLIDAYS.items() if d.year == year}

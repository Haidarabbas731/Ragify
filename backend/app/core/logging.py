import logging
from enum import StrEnum

LOG_FORMAT_DEBUG = "%(levelname)s:%(message)s:%(pathname)s:%(funcName)s:%(lineno)d"
LOG_FORMAT_PROD = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


class LogLevels(StrEnum):
    info = "INFO"
    warn = "WARN"
    error = "ERROR"
    debug = "DEBUG"


def configure_logging(log_level: str = LogLevels.error):
    """
    Configure logging with appropriate format and level.

    Args:
        log_level: Logging level (INFO, WARN, ERROR, DEBUG)
    """
    log_level = str(log_level).upper()
    log_levels = [level.value for level in LogLevels]

    if log_level not in log_levels:
        logging.basicConfig(level=LogLevels.error, format=LOG_FORMAT_PROD)
        return

    if log_level == LogLevels.debug:
        logging.basicConfig(level=log_level, format=LOG_FORMAT_DEBUG)
        return

    logging.basicConfig(level=log_level, format=LOG_FORMAT_PROD)

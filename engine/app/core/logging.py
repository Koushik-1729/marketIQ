import sys
import structlog
from typing import Any, Dict

def setup_logging(log_level: str = "INFO") -> None:
    """Configure structlog for the application."""
    
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]
    
    if log_level.upper() == "INFO":
        level = 20
    elif log_level.upper() == "DEBUG":
        level = 10
    elif log_level.upper() == "WARNING":
        level = 30
    elif log_level.upper() == "ERROR":
        level = 40
    else:
        level = 20

    import logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )

    if sys.stdout.isatty():
        processors.append(structlog.dev.ConsoleRenderer())
    else:
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

def get_logger(name: str) -> structlog.BoundLogger:
    """Get a bound structlog logger."""
    return structlog.get_logger(name)

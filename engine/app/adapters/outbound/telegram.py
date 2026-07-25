"""
Telegram notification outbound adapter.
"""
from __future__ import annotations

import httpx
import structlog

log = structlog.get_logger(__name__)


class TelegramAdapter:
    def __init__(self, bot_token: str, chat_id: str):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    async def send_message(self, text: str, parse_mode: str = "HTML") -> bool:
        if not self.bot_token or not self.chat_id:
            log.warning("telegram_credentials_missing")
            return False

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/sendMessage",
                    json={
                        "chat_id": self.chat_id,
                        "text": text,
                        "parse_mode": parse_mode,
                        "disable_web_page_preview": True,
                    },
                )
                if resp.status_code == 200:
                    log.info("telegram_message_sent", chat_id=self.chat_id)
                    return True
                else:
                    log.error("telegram_send_failed", status=resp.status_code, body=resp.text)
                    return False
            except Exception as exc:
                log.error("telegram_exception", error=str(exc))
                return False

    async def send_report(self, report_text: str) -> bool:
        """Splits long messages into chunks of <= 4000 characters and sends sequentially."""
        max_chunk = 4000
        chunks = [report_text[i:i + max_chunk] for i in range(0, len(report_text), max_chunk)]
        all_success = True
        for chunk in chunks:
            ok = await self.send_message(chunk)
            if not ok:
                all_success = False
        return all_success

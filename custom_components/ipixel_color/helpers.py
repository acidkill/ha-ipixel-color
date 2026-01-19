"""Helper classes for iPIXEL Color."""
from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path
from typing import Any

import aiohttp
from PIL import Image, ImageSequence

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

class GifManager:
    """Manager for GIF files."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the GIF manager."""
        self.hass = hass
        self._media_dir = Path(hass.config.path("ipixel_media"))
        self._ensure_media_dir()

    def _ensure_media_dir(self) -> None:
        """Ensure media directory exists."""
        if not self._media_dir.exists():
            self._media_dir.mkdir(parents=True, exist_ok=True)

    async def async_add_gif(self, url: str, alias: str) -> bool:
        """Download and save a GIF file."""
        try:
            # Create safe filename from alias
            safe_filename = "".join([c for c in alias if c.isalnum() or c in (' ', '-', '_')]).strip()
            if not safe_filename:
                safe_filename = "unnamed_gif"
            filename = f"{safe_filename}.gif"
            filepath = self._media_dir / filename

            # Download file
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        _LOGGER.error("Failed to download GIF: %s", response.status)
                        return False
                    content = await response.read()

            # Validate GIF using PIL in executor to avoid blocking loop
            def validate_and_save():
                with open(filepath, "wb") as f:
                    f.write(content)

                try:
                    with Image.open(filepath) as img:
                        if img.format != "GIF":
                            _LOGGER.error("File is not a GIF")
                            os.remove(filepath)
                            return False
                        # Check if animated
                        if not getattr(img, "is_animated", False):
                             _LOGGER.warning("GIF is not animated")
                             # We still allow it, but warn
                        return True
                except Exception as err:
                    _LOGGER.error("Invalid image file: %s", err)
                    if filepath.exists():
                        os.remove(filepath)
                    return False

            return await self.hass.async_add_executor_job(validate_and_save)

        except Exception as err:
            _LOGGER.error("Error adding GIF: %s", err)
            return False

    def get_gifs(self) -> list[str]:
        """Return list of available GIF filenames."""
        if not self._media_dir.exists():
            return []
        return [f.name for f in self._media_dir.glob("*.gif")]

    def delete_gif(self, filename: str) -> bool:
        """Delete a GIF file."""
        filepath = self._media_dir / filename
        if filepath.exists():
            try:
                filepath.unlink()
                return True
            except Exception as err:
                _LOGGER.error("Error deleting GIF: %s", err)
                return False
        return False

    def get_gif_path(self, filename: str) -> Path | None:
        """Get full path for a GIF file."""
        filepath = self._media_dir / filename
        if filepath.exists():
            return filepath
        return None

    async def get_gif_duration(self, filename: str) -> float:
        """Get total duration of GIF in seconds."""
        filepath = self._media_dir / filename
        if not filepath.exists():
            return 0.0

        def calculate_duration():
            try:
                with Image.open(filepath) as img:
                    if not getattr(img, "is_animated", False):
                        return 5.0 # Default for static images

                    total_duration = 0
                    for frame in ImageSequence.Iterator(img):
                        total_duration += frame.info.get('duration', 100)
                    return total_duration / 1000.0
            except Exception:
                return 5.0

        return await self.hass.async_add_executor_job(calculate_duration)

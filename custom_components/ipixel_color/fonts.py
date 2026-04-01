"""Font location utilities for iPIXEL Color integration."""

from __future__ import annotations

import logging
from collections.abc import Sequence
from functools import lru_cache
from pathlib import Path

_LOGGER = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_font_locations_cached() -> tuple[Path, ...]:
    """Get list of font directories sorted by priority (cached version)."""
    locations = []

    # 1st priority: Custom fonts from this integration
    custom_fonts_dir = Path(__file__).parent / "fonts"
    if custom_fonts_dir.exists() and custom_fonts_dir.is_dir():
        locations.append(custom_fonts_dir)
        _LOGGER.debug("Added custom fonts directory: %s", custom_fonts_dir)

    # 2nd priority: pypixelcolor package fonts
    try:
        import pypixelcolor

        pypixelcolor_fonts_dir = Path(pypixelcolor.__file__).parent / "fonts"
        if pypixelcolor_fonts_dir.exists() and pypixelcolor_fonts_dir.is_dir():
            locations.append(pypixelcolor_fonts_dir)
            _LOGGER.debug(
                "Added pypixelcolor fonts directory: %s", pypixelcolor_fonts_dir
            )
    except (ImportError, AttributeError) as e:
        _LOGGER.debug("Could not locate pypixelcolor fonts: %s", e)

    # 3rd priority: System fonts (Linux standard locations)
    system_font_paths = [
        Path("/usr/share/fonts"),
        Path("/usr/local/share/fonts"),
        Path.home() / ".fonts",
        Path.home() / "fonts",
        Path.home() / "homeassistant/fonts",
        Path.home() / ".local/share/fonts",
    ]

    for font_path in system_font_paths:
        if font_path.exists() and font_path.is_dir():
            locations.append(font_path)
            _LOGGER.debug("Added system fonts directory: %s", font_path)

    if not locations:
        _LOGGER.warning("No font directories found!")

    return tuple(locations)


def get_font_locations() -> list[Path]:
    """Get list of font directories sorted by priority.

    Priority order:
    1. Custom fonts from this integration's fonts/ folder
    2. Fonts from pypixelcolor package
    3. System fonts (Linux standard locations)

    Returns:
        List of Path objects for font directories that exist
    """
    return list(_get_font_locations_cached())


@lru_cache(maxsize=128)
def _get_font_path_cached(
    font_name: str, locations: tuple[Path, ...] | None = None
) -> Path | None:
    """Find font file in available font locations (cached version)."""
    # Add common font extensions if not present
    if not any(
        font_name.lower().endswith(ext) for ext in [".ttf", ".otf", ".woff", ".woff2"]
    ):
        font_name += ".ttf"

    # Get font locations if not provided
    if locations is None:
        locations = _get_font_locations_cached()

    # Search each location in priority order
    for location in locations:
        font_path = location / font_name
        if font_path.exists() and font_path.is_file():
            _LOGGER.debug("Found font %s in %s", font_name, location)
            return font_path

        # Also search subdirectories (common for system fonts)
        for subfont_path in location.rglob(font_name):
            if subfont_path.is_file():
                _LOGGER.debug("Found font %s in %s", font_name, subfont_path.parent)
                return subfont_path

    _LOGGER.warning("Font %s not found in any location", font_name)
    return None


def get_font_path(
    font_name: str, locations: Sequence[Path] | None = None
) -> Path | None:
    """Find font file in available font locations.

    Args:
        font_name: Font filename (with or without extension)
        locations: Optional sequence of font directories to search (uses get_font_locations() if None)

    Returns:
        Path to font file if found, None otherwise
    """
    if locations is not None and not isinstance(locations, tuple):
        locations = tuple(locations)
    return _get_font_path_cached(font_name, locations)


@lru_cache(maxsize=1)
def _get_available_fonts_cached(
    locations: tuple[Path, ...] | None = None,
) -> tuple[str, ...]:
    """Get list of available font filenames from all locations (cached version)."""
    if locations is None:
        locations = _get_font_locations_cached()

    fonts = set()

    # Scan each location for fonts
    for location in locations:
        try:
            # Scan for TTF fonts
            for font_file in location.glob("*.ttf"):
                fonts.add(font_file.name)

            # Scan for OTF fonts
            for font_file in location.glob("*.otf"):
                fonts.add(font_file.name)

            # Also check subdirectories (for system fonts)
            for font_file in location.rglob("*.ttf"):
                if font_file.is_file():
                    fonts.add(font_file.name)

            for font_file in location.rglob("*.otf"):
                if font_file.is_file():
                    fonts.add(font_file.name)

        except (OSError, PermissionError) as e:
            _LOGGER.debug("Could not scan directory %s: %s", location, e)

    # Ensure we have at least a default font
    if not fonts:
        fonts.add("OpenSans-Light.ttf")

    _LOGGER.debug("Found %d unique fonts across all locations", len(fonts))
    return tuple(sorted(list(fonts)))


def get_available_fonts(locations: Sequence[Path] | None = None) -> list[str]:
    """Get list of available font filenames from all locations.

    Args:
        locations: Optional sequence of font directories to search (uses get_font_locations() if None)

    Returns:
        Sorted list of unique font filenames
    """
    if locations is not None and not isinstance(locations, tuple):
        locations = tuple(locations)
    return list(_get_available_fonts_cached(locations))

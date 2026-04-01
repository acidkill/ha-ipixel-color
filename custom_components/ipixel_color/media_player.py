"""Media Player platform for iPIXEL Color."""
from __future__ import annotations

import asyncio
import logging
import random
from typing import Any

from homeassistant.components.media_player import (
    MediaPlayerEntity,
    MediaPlayerEntityFeature,
    MediaPlayerState,
    MediaType,
    RepeatMode,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .api import iPIXELAPI
from .const import DOMAIN, CONF_ADDRESS, CONF_NAME
from .helpers import GifManager

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the iPIXEL Color media player."""
    address = entry.data[CONF_ADDRESS]
    name = entry.data[CONF_NAME]

    api = hass.data[DOMAIN][entry.entry_id]
    gif_manager = GifManager(hass)

    async_add_entities([
        iPIXELMediaPlayer(hass, api, entry, address, name, gif_manager)
    ])


class iPIXELMediaPlayer(MediaPlayerEntity):
    """Representation of an iPIXEL Color Media Player."""

    _attr_has_entity_name = True
    _attr_name = None
    _attr_media_content_type = MediaType.IMAGE
    _attr_supported_features = (
        MediaPlayerEntityFeature.PLAY
        | MediaPlayerEntityFeature.STOP
        | MediaPlayerEntityFeature.PAUSE
        | MediaPlayerEntityFeature.NEXT_TRACK
        | MediaPlayerEntityFeature.PREVIOUS_TRACK
        | MediaPlayerEntityFeature.SELECT_SOURCE
        | MediaPlayerEntityFeature.PLAY_MEDIA
        | MediaPlayerEntityFeature.REPEAT_SET
        | MediaPlayerEntityFeature.SHUFFLE_SET
    )

    def __init__(
        self,
        hass: HomeAssistant,
        api: iPIXELAPI,
        entry: ConfigEntry,
        address: str,
        name: str,
        gif_manager: GifManager,
    ) -> None:
        """Initialize the media player."""
        self.hass = hass
        self._api = api
        self._entry = entry
        self._address = address
        self._device_name = name
        self._gif_manager = gif_manager

        self._attr_unique_id = f"{address}_media_player"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, address)},
            name=name,
            manufacturer="iPIXEL",
            model="LED Matrix Display",
            sw_version="1.0",
        )

        self._attr_state = MediaPlayerState.IDLE
        self._attr_source_list = []
        self._attr_source = None
        self._attr_repeat = RepeatMode.OFF
        self._attr_shuffle = False

        self._playback_task: asyncio.Task | None = None
        self._current_gif_index = 0

    async def async_added_to_hass(self) -> None:
        """Run when entity about to be added to hass."""
        await super().async_added_to_hass()
        await self.async_update_source_list()

    async def async_update_source_list(self) -> None:
        """Update available GIFs."""
        self._attr_source_list = sorted(await self._gif_manager.async_get_gifs())

    async def async_select_source(self, source: str) -> None:
        """Select a specific source."""
        if source in self._attr_source_list:
            self._attr_source = source
            if source in self._attr_source_list:
                self._current_gif_index = self._attr_source_list.index(source)
            await self.async_play_media(MediaType.IMAGE, source)

    async def async_play_media(self, media_type: str, media_id: str, **kwargs: Any) -> None:
        """Play a piece of media."""
        # If media_id is a URL, try to download it first?
        # For now, assume it's a filename in our list or a full path if passed by system

        # Check if it is one of our managed GIFs
        if media_id in self._attr_source_list:
             self._attr_source = media_id
             if media_id in self._attr_source_list:
                 self._current_gif_index = self._attr_source_list.index(media_id)

        await self._start_playback(media_id)

    async def _start_playback(self, filename: str) -> None:
        """Start playback logic."""
        self._cancel_playback()
        self._attr_state = MediaPlayerState.PLAYING
        self.async_write_ha_state()

        self._playback_task = self.hass.async_create_task(self._playback_loop(filename))

    def _cancel_playback(self) -> None:
        """Cancel current playback task."""
        if self._playback_task:
            self._playback_task.cancel()
            self._playback_task = None

    async def _playback_loop(self, initial_filename: str) -> None:
        """Loop for playing GIFs."""
        current_filename = initial_filename

        try:
            while True:
                # Get full path
                file_path = await self._gif_manager.async_get_gif_path(current_filename)

                if file_path:
                    # Send to device
                    await self._api.display_image_file(str(file_path))

                    # Get duration
                    duration = await self._gif_manager.get_gif_duration(current_filename)
                    # Add a small buffer to duration
                    wait_time = max(duration, 1.0)

                else:
                    _LOGGER.warning("File not found: %s", current_filename)
                    wait_time = 5.0 # Fallback wait

                # Update state
                self._attr_media_title = current_filename
                self._attr_source = current_filename
                self.async_write_ha_state()

                # Wait for the GIF to play
                await asyncio.sleep(wait_time)

                # Determine next action based on Repeat/Shuffle
                if self._attr_repeat == RepeatMode.ONE:
                    # Keep playing same file
                    continue

                # Check if we should stop (No repeat)
                if self._attr_repeat == RepeatMode.OFF and not self._attr_shuffle:
                    # One-shot play then idle
                    self._attr_state = MediaPlayerState.IDLE
                    self.async_write_ha_state()
                    break

                # Determine next file
                await self.async_update_source_list() # Refresh list in case something changed
                if not self._attr_source_list:
                    break

                if self._attr_shuffle:
                    current_filename = random.choice(self._attr_source_list)
                    if current_filename in self._attr_source_list:
                        self._current_gif_index = self._attr_source_list.index(current_filename)
                else:
                    # Next in list
                    self._current_gif_index = (self._current_gif_index + 1) % len(self._attr_source_list)
                    current_filename = self._attr_source_list[self._current_gif_index]

                    # If we wrapped around and RepeatMode is OFF (but we are in this loop? Wait, logic check)
                    # Actually if RepeatMode is OFF we broke out earlier.
                    # Wait, if RepeatMode is ALL, we loop.
                    pass

        except asyncio.CancelledError:
            pass
        except Exception as err:
            _LOGGER.error("Error in playback loop: %s", err)
            self._attr_state = MediaPlayerState.IDLE
            self.async_write_ha_state()

    async def async_media_play(self) -> None:
        """Send play command."""
        if self._attr_source:
             await self._start_playback(self._attr_source)

    async def async_media_pause(self) -> None:
        """Send pause command."""
        self._cancel_playback()
        self._attr_state = MediaPlayerState.PAUSED
        self.async_write_ha_state()

    async def async_media_stop(self) -> None:
        """Send stop command."""
        self._cancel_playback()
        self._attr_state = MediaPlayerState.IDLE
        self.async_write_ha_state()
        # Optionally clear screen or something?

    async def async_media_next_track(self) -> None:
        """Send next track command."""
        await self.async_update_source_list()
        if not self._attr_source_list:
            return

        if self._attr_shuffle:
            next_file = random.choice(self._attr_source_list)
        else:
            self._current_gif_index = (self._current_gif_index + 1) % len(self._attr_source_list)
            next_file = self._attr_source_list[self._current_gif_index]

        await self._start_playback(next_file)

    async def async_media_previous_track(self) -> None:
        """Send previous track command."""
        await self.async_update_source_list()
        if not self._attr_source_list:
            return

        if self._attr_shuffle:
            prev_file = random.choice(self._attr_source_list)
        else:
            self._current_gif_index = (self._current_gif_index - 1) % len(self._attr_source_list)
            prev_file = self._attr_source_list[self._current_gif_index]

        await self._start_playback(prev_file)

    async def async_set_repeat(self, repeat: RepeatMode) -> None:
        """Set repeat mode."""
        self._attr_repeat = repeat
        self.async_write_ha_state()

    async def async_set_shuffle(self, shuffle: bool) -> None:
        """Enable/disable shuffle mode."""
        self._attr_shuffle = shuffle
        self.async_write_ha_state()

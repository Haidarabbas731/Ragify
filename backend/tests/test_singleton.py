"""
Unit tests for core/singleton.py - lazily created shared instances.
"""

import asyncio

import pytest

from app.core.singleton import async_singleton


def counting_factory(calls: list, fail_first: bool = False):
    """A factory that records each build and optionally fails once."""

    async def build():
        calls.append(1)
        await asyncio.sleep(0)  # let concurrent callers pile up
        if fail_first and len(calls) == 1:
            raise RuntimeError("not ready")
        return object()

    return build


@pytest.mark.asyncio
async def test_built_once_and_shared():
    """Every call returns the same instance; the factory runs once."""
    calls: list = []
    get = async_singleton(counting_factory(calls))

    assert await get() is await get()
    assert len(calls) == 1


@pytest.mark.asyncio
async def test_concurrent_first_callers_share_one_build():
    """Callers racing on first use wait for one build instead of each making their own."""
    calls: list = []
    get = async_singleton(counting_factory(calls))

    results = await asyncio.gather(*(get() for _ in range(5)))

    assert len(calls) == 1
    assert all(r is results[0] for r in results)


@pytest.mark.asyncio
async def test_a_failed_build_is_not_cached():
    """If the factory raises, the next call tries again instead of returning a broken instance."""
    calls: list = []
    get = async_singleton(counting_factory(calls, fail_first=True))

    with pytest.raises(RuntimeError):
        await get()
    instance = await get()

    assert len(calls) == 2
    assert await get() is instance


@pytest.mark.asyncio
async def test_reset_forgets_the_instance():
    """reset() makes the next call build a fresh instance."""
    calls: list = []
    get = async_singleton(counting_factory(calls))
    first = await get()

    get.reset()

    assert await get() is not first
    assert len(calls) == 2

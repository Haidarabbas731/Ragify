import asyncio
from collections.abc import Awaitable, Callable
from functools import wraps
from typing import TypeVar

T = TypeVar("T")


def async_singleton(factory: Callable[[], Awaitable[T]]) -> Callable[[], Awaitable[T]]:
    """
    Turn an async factory into a lazily created, process-wide singleton getter.

    The first caller builds the instance (concurrent first callers wait for that one build).
    If the factory raises, nothing is cached and the next call tries again. The returned
    function is a real coroutine function, so it can be patched like any other, and has a
    ``reset()`` attribute that forgets the instance (used by tests).

    Args:
        factory: Async function that creates the instance

    Returns:
        Callable[[], Awaitable[T]]: Getter that returns the shared instance
    """
    lock = asyncio.Lock()
    instance: list[T] = []

    @wraps(factory)
    async def get() -> T:
        if not instance:
            async with lock:
                if not instance:
                    instance.append(await factory())
        return instance[0]

    get.reset = instance.clear  # type: ignore[attr-defined]
    return get

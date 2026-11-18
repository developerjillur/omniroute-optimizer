"""Verify unchanged key values with explicitly authorized authentication telemetry."""
from datetime import datetime, timezone


def instant(value):
    assert isinstance(value, str) and value
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed


def compare(before, after, began, ended, authenticated_ids):
    low, high = instant(began), instant(ended)
    assert high >= low
    original = {row['id']: row for row in before}
    current = {row['id']: row for row in after}
    assert len(original) == len(before) and len(current) == len(after)
    assert original.keys() <= current.keys(), 'An existing key row disappeared'
    allowed = set(authenticated_ids)
    assert allowed and allowed <= original.keys(), (
        'Only existing, explicitly selected authentication keys may record use'
    )
    telemetry = 0
    for identity, row in original.items():
        newer = current[identity]
        changed = [
            key for key, value in row.items()
            if key not in newer or (type(value), value) != (type(newer[key]), newer[key])
        ]
        if not changed:
            continue
        assert changed == ['last_used_at'], 'An immutable key, credential or scope changed'
        assert identity in allowed, 'An unrelated key recorded use'
        used = instant(newer['last_used_at'])
        assert low <= used <= high, 'Key-use telemetry was written outside the accepted probe window'
        if row['last_used_at'] is not None:
            assert used >= instant(row['last_used_at']), 'Key-use telemetry moved backwards'
        telemetry += 1
    return {
        'existingKeyRows': len(before),
        'credentialAndScopeValuesUnchanged': True,
        'monotonicAuthenticatedLastUsedRows': telemetry,
        'explicitlyAuthorizedKeys': len(allowed),
        'otherKeyColumnsChanged': 0,
    }

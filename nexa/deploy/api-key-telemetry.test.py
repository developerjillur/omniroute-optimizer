from pathlib import Path
import copy
import importlib.util
import unittest

spec = importlib.util.spec_from_file_location(
    'key_telemetry', Path(__file__).with_name('api-key-telemetry.py')
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Telemetry(unittest.TestCase):
    def setUp(self):
        self.before = [
            {
                'id': name,
                'key': 'unchanged-' + name,
                'scopes': ['manage'] if name == 'bridge' else ['inference'],
                'last_used_at': '2026-11-18T18:00:00Z',
            }
            for name in ['ordinary', 'bridge', 'unrelated']
        ]
        self.after = copy.deepcopy(self.before)
        for row in self.after[:2]:
            row['last_used_at'] = '2026-11-18T18:01:00Z'

    def check(self):
        return module.compare(
            self.before, self.after,
            '2026-11-18T18:00:30Z', '2026-11-18T18:02:00Z',
            {'ordinary', 'bridge'},
        )

    def test_both_explicit_callers_may_record_authentication(self):
        self.assertEqual(self.check()['monotonicAuthenticatedLastUsedRows'], 2)

    def test_unrelated_key_use_is_refused(self):
        self.after[2]['last_used_at'] = '2026-11-18T18:01:00Z'
        with self.assertRaisesRegex(AssertionError, 'unrelated'):
            self.check()

    def test_credential_change_is_refused(self):
        self.after[0]['key'] = 'changed'
        with self.assertRaisesRegex(AssertionError, 'immutable'):
            self.check()

    def test_scope_change_is_refused(self):
        self.after[1]['scopes'] = ['inference']
        with self.assertRaisesRegex(AssertionError, 'immutable'):
            self.check()

    def test_outside_probe_window_is_refused(self):
        self.after[0]['last_used_at'] = '2026-11-18T18:03:00Z'
        with self.assertRaisesRegex(AssertionError, 'outside'):
            self.check()

    def test_backward_key_use_is_refused(self):
        self.before[0]['last_used_at'] = '2026-11-18T18:01:30Z'
        with self.assertRaisesRegex(AssertionError, 'backwards'):
            self.check()

    def test_missing_existing_key_is_refused(self):
        self.after.pop()
        with self.assertRaisesRegex(AssertionError, 'disappeared'):
            self.check()

    def test_unknown_authorized_key_is_refused(self):
        with self.assertRaisesRegex(AssertionError, 'Only existing'):
            module.compare(
                self.before, self.after,
                '2026-11-18T18:00:30Z', '2026-11-18T18:02:00Z',
                {'invented'},
            )


if __name__ == '__main__':
    unittest.main()

import { formatRestTime } from '../js/timer-utils.js';

test('formatRestTime formats full minutes', () => {
  expect(formatRestTime(120)).toBe('2:00');
});

test('formatRestTime pads seconds', () => {
  expect(formatRestTime(65)).toBe('1:05');
});

test('formatRestTime handles sub-minute', () => {
  expect(formatRestTime(9)).toBe('0:09');
});

test('formatRestTime handles zero', () => {
  expect(formatRestTime(0)).toBe('0:00');
});

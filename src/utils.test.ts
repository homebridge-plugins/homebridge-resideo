import { describe, expect, it } from 'vitest'

import { toCelsius, toCelsiusWithOverride } from './utils.js'

describe('toCelsius', () => {
  it('should return the same value if the unit is 0 (Celsius)', () => {
    expect(toCelsius(25, 0)).toBe(25)
  })

  it('should convert Fahrenheit to Celsius correctly', () => {
    expect(toCelsius(32, 1)).toBe(0) // 32°F is 0°C
    expect(toCelsius(68, 1)).toBe(20) // 68°F is 20°C
    expect(toCelsius(100, 1)).toBe(37.5) // 100°F is 37.5°C (this is known to fail due to rounding)
  })

  it('should round to the nearest 0.5 degree', () => {
    expect(toCelsius(33, 1)).toBe(0.5) // 33°F is 0.5°C
    expect(toCelsius(34, 1)).toBe(1) // 34°F is 1°C
  })
})

describe('toCelsiusWithOverride', () => {
  it('should use default toCelsius behavior when convertUnits is undefined', () => {
    expect(toCelsiusWithOverride(25, 0, undefined)).toBe(25) // Celsius, no conversion
    expect(toCelsiusWithOverride(32, 1, undefined)).toBe(0) // Fahrenheit to Celsius
  })

  it('should use default toCelsius behavior when convertUnits is empty string', () => {
    expect(toCelsiusWithOverride(25, 0, '')).toBe(25) // Celsius, no conversion
    expect(toCelsiusWithOverride(32, 1, '')).toBe(0) // Fahrenheit to Celsius
  })

  it('should force conversion from Fahrenheit when convertUnits is "fahrenheit"', () => {
    expect(toCelsiusWithOverride(32, 0, 'fahrenheit')).toBe(0) // Force F->C conversion even with unit=0
    expect(toCelsiusWithOverride(68, 0, 'fahrenheit')).toBe(20) // Force F->C conversion even with unit=0
    expect(toCelsiusWithOverride(32, 1, 'fahrenheit')).toBe(0) // Force F->C conversion with unit=1
  })

  it('should force no conversion when convertUnits is "celsius"', () => {
    expect(toCelsiusWithOverride(20, 1, 'celsius')).toBe(20) // No conversion even with unit=1
    expect(toCelsiusWithOverride(25, 1, 'celsius')).toBe(25) // No conversion even with unit=1
    expect(toCelsiusWithOverride(30, 0, 'celsius')).toBe(30) // No conversion with unit=0
  })

  it('should handle the stuck temperature scenario', () => {
    // Test case: API reports 68°F current temp but device.units says "Celsius"
    // This would cause wrong conversion, but convertUnits="fahrenheit" should fix it
    expect(toCelsiusWithOverride(68, 0, 'fahrenheit')).toBe(20) // 68°F = 20°C when forced
    expect(toCelsiusWithOverride(75, 0, 'fahrenheit')).toBe(24) // 75°F = 23.89°C ≈ 24°C when forced
  })
})

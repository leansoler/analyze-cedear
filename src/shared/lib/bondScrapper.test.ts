// Unit tests for the bondScrapper.
// These tests mock the browser and page objects to ensure the scraper's
// logic is sound without making actual network requests.

import { scrap } from './bondScrapper';
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Mock the external dependencies to prevent actual browser launching during tests.
jest.mock('puppeteer');
jest.mock('puppeteer-core');
jest.mock('@sparticuz/chromium');

describe('bondScrapper', () => {
  // Create mock objects for the puppeteer page and browser.
  // These will be used in place of the real browser interactions.
  const mockPage = {
    setRequestInterception: jest.fn(),
    on: jest.fn(),
    goto: jest.fn(),
    select: jest.fn(),
    evaluate: jest.fn(),
    close: jest.fn(),
  };

  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue(mockPage),
    close: jest.fn(),
  };

  // Before each test, we clear all mocks and reset their implementations to ensure a clean state.
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations to their default behavior for each test.
    // This prevents a test's mock configuration from affecting other tests.
    mockPage.setRequestInterception.mockResolvedValue(undefined);
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.select.mockResolvedValue(undefined);
    mockPage.evaluate.mockResolvedValue({}); // Default to returning no data
    mockPage.close.mockResolvedValue(undefined);
    mockBrowser.close.mockResolvedValue(undefined);

    // Set up the mock implementations for the launch functions.
    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
    (puppeteerCore.launch as jest.Mock).mockResolvedValue(mockBrowser);
    // Mock the executable path for the production environment.
    (chromium.executablePath as jest.Mock).mockResolvedValue(
      '/fake/path/to/chromium',
    );
  });

  test('should scrape data correctly when running locally', async () => {
    // Arrange: Define the mock data to be returned by the page.evaluate call.
    const expectedData = { BOND1: 100.5, BOND2: 200.75 };
    mockPage.evaluate.mockResolvedValue(expectedData);

    // Act: Call the scrap function. This will use a real 500ms setTimeout,
    // which is acceptable and more reliable than using fake timers here.
    const result = await scrap(true);

    // Assert: Verify the result matches the expected data and that the
    // correct functions were called.
    expect(result).toEqual(expectedData);
    expect(puppeteer.launch).toHaveBeenCalled(); // Local launch
    expect(puppeteerCore.launch).not.toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
    );
    expect(mockPage.select).toHaveBeenCalledWith(
      'select[name="cotizaciones_length"]',
      '-1',
    );
    expect(mockPage.evaluate).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  test('should scrape data correctly when running in production', async () => {
    // Arrange: Set up mock data for the production path.
    const expectedData = { PRODBOND: 300.0 };
    mockPage.evaluate.mockResolvedValue(expectedData);

    // Act: Call the scrap function for a production environment.
    const result = await scrap(false);

    // Assert: Verify the results and that the production-specific
    // launch function was used.
    expect(result).toEqual(expectedData);
    expect(puppeteerCore.launch).toHaveBeenCalled(); // Production launch
    expect(puppeteer.launch).not.toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  test('should return an empty object if scraping finds no data', async () => {
    // Arrange: Mock an empty response from the page (this is the default).
    mockPage.evaluate.mockResolvedValue({});

    // Act: Run the scraper.
    const result = await scrap(true);

    // Assert: Ensure the result is an empty object.
    expect(result).toEqual({});
  });

  test('should close the browser even if an error occurs', async () => {
    // Arrange: Simulate an error during page navigation.
    const scrapingError = new Error('Failed to navigate');
    mockPage.goto.mockRejectedValue(scrapingError);

    // Act & Assert: Expect the scrap function to reject with the same error.
    await expect(scrap(true)).rejects.toThrow(scrapingError);

    // Finally, verify that the browser was still closed due to the
    // 'finally' block in the scrap function.
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});

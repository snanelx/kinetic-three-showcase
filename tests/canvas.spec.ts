import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "desktop", width: 1440, height: 960 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test(`Three.js canvas renders non-empty pixels on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await page.waitForTimeout(900);

    const sample = await page.locator("#space").evaluate((canvas) => {
      const source = canvas as HTMLCanvasElement;
      const probe = document.createElement("canvas");
      probe.width = 64;
      probe.height = 64;

      const context = probe.getContext("2d");
      if (!context) {
        return { colors: 0, alphaPixels: 0 };
      }

      context.drawImage(source, 0, 0, probe.width, probe.height);
      const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
      const colors = new Set<string>();
      let alphaPixels = 0;

      for (let index = 0; index < pixels.length; index += 4) {
        const alpha = pixels[index + 3];
        if (alpha > 0) {
          alphaPixels += 1;
          colors.add(`${pixels[index]}-${pixels[index + 1]}-${pixels[index + 2]}`);
        }
      }

      return { colors: colors.size, alphaPixels };
    });

    expect(sample.alphaPixels).toBeGreaterThan(64);
    expect(sample.colors).toBeGreaterThan(2);
  });
}

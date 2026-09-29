// Open the production preview, then run:
// playwright-cli run-code --filename=scripts/browser-offline-check.js
// Uses an isolated context and synthetic documents. No provider requests.
// eslint-disable-next-line no-unused-expressions -- Playwright CLI evaluates this callback.
async (page) => {
  const context = await page
    .context()
    .browser()
    .newContext({ locale: "en-US", viewport: { width: 1440, height: 1000 } });
  const url = page.url();
  const errors = [];
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const saved = () => page.getByText(/^Saved/).waitFor();
  const source = () =>
    page.getByRole("textbox", { name: "Current CV Text", exact: true });
  const title = () =>
    page.getByRole("textbox", { name: "Document title", exact: true });
  const download = async (name) => {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: true }).click();
    return await pending;
  };
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  try {
    await page.goto(url);
    await page.getByText("Ready for offline use.", { exact: false }).waitFor();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const cached = await page.evaluate(async () => {
      const keys = await caches.keys();
      const cache = await caches.open(
        keys.find((key) => key.startsWith("custom-cv-shell:")),
      );
      return (await cache.keys()).map((request) => request.url);
    });
    check(
      cached.some((asset) => /pdf.worker.*\.mjs$/.test(asset)),
      "PDF worker not precached",
    );
    // Disconnect before creating any documents to exercise first-use offline.
    await context.setOffline(true);
    await page.reload();
    await page.getByText("You are offline.", { exact: false }).waitFor();
    await page
      .getByRole("button", { name: "New CV", exact: true })
      .first()
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector('input[aria-label="Document title"]')?.value ===
        "",
    );
    await title().fill("Offline A");
    await source().fill("Offline source A");
    check(
      (await title().inputValue()) === "Offline A",
      "Title A lost after source edit",
    );
    await page.getByRole("button", { name: "Content", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("José Offline");
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill("offline@example.test");
    check(
      (await title().inputValue()) === "Offline A",
      "Title A lost after content edit",
    );
    await saved();
    check(
      (await title().inputValue()) === "Offline A",
      "Title A lost after content save",
    );
    await page.getByRole("button", { name: "Style", exact: true }).click();
    await page.getByLabel("Document font").selectOption("times");
    await page.getByRole("button", { name: "Burgundy", exact: true }).click();
    check(
      (await title().inputValue()) === "Offline A",
      "Title A lost after style edit",
    );
    await saved();
    await page
      .getByRole("button", { name: "New CV", exact: true })
      .first()
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector('input[aria-label="Document title"]')?.value ===
        "",
    );
    await title().fill("Offline B");
    await source().fill("Offline source B");
    await saved();
    await page
      .getByRole("complementary")
      .getByRole("button", { name: /^Offline A/ })
      .click();
    await page.reload();
    check(
      (await source().inputValue()) === "Offline source A",
      "Offline reload lost source A",
    );
    await page.getByRole("button", { name: "Content", exact: true }).click();
    check(
      (await page
        .getByRole("textbox", { name: "Name", exact: true })
        .inputValue()) === "José Offline",
      "Offline reload lost content",
    );
    await page.getByRole("button", { name: "Style", exact: true }).click();
    check(
      (await page.getByLabel("Document font").inputValue()) === "times",
      "Offline reload lost font",
    );
    check(
      (await page
        .getByRole("button", { name: "Burgundy", exact: true })
        .getAttribute("aria-pressed")) === "true",
      "Offline reload lost accent",
    );
    await page.waitForFunction(
      () => document.querySelector("canvas")?.width > 0,
    );
    const pdf = await download("Download PDF");
    await pdf.saveAs("/tmp/cv-offline-export.pdf");
    await saved();
    const backupDownload = await download("Export backup");
    await backupDownload.saveAs("/tmp/cv-offline-backup.json");
    const backup = await page.evaluate(
      async () =>
        new Promise((resolve, reject) => {
          const request = indexedDB.open("custom-cv-library", 1);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const read = db
              .transaction("documents")
              .objectStore("documents")
              .getAll();
            read.onerror = () => {
              db.close();
              reject(read.error);
            };
            read.onsuccess = () => {
              db.close();
              resolve({
                format: "custom-cv-backup",
                version: 1,
                documents: read.result,
              });
            };
          };
        }),
    );
    const fixture = backup.documents.find(
      (document) => document.title === "Offline A",
    );
    fixture.title = "Offline imported";
    fixture.provider.apiKey = "synthetic-key-must-be-stripped";
    fixture.data.experience = Array.from({ length: 16 }, (_, index) => ({
      role: "Role " + index,
      company: "Company " + index,
      dates: "2020–2026",
      bullets: [
        "Complete role details ".repeat(10),
        index === 15 ? "FINAL_ROLE_OFFLINE_MARKER" : "Career achievement",
      ],
    }));
    backup.documents = [fixture];
    // Import immediately after an edit. Existing work must survive without a reload.
    await page.getByRole("button", { name: "Source", exact: true }).click();
    await source().fill("Pending edits preserved during import");
    await page.evaluate((payload) => {
      const input = document.querySelector("aside input[type=file]");
      const transfer = new DataTransfer();
      transfer.items.add(
        new File([payload], "backup.json", { type: "application/json" }),
      );
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, JSON.stringify(backup));
    await page
      .getByRole("complementary")
      .getByRole("button", { name: /^Offline imported/ })
      .waitFor();
    check(
      (await title().inputValue()) === "Offline imported",
      "Import did not select new document",
    );
    await page
      .getByRole("complementary")
      .getByRole("button", { name: /^Offline A/ })
      .click();
    check(
      (await source().inputValue()) === "Pending edits preserved during import",
      "Import lost pending edits",
    );
    await page
      .getByRole("complementary")
      .getByRole("button", { name: /^Offline imported/ })
      .click();
    const longPdf = await download("Download PDF");
    await longPdf.saveAs("/tmp/cv-offline-long.pdf");
    await saved();
    await page
      .locator("form input[type=file]")
      .setInputFiles("/tmp/cv-offline-long.pdf");
    await page.waitForFunction(() =>
      document
        .querySelector("textarea")
        ?.value.includes("FINAL_ROLE_OFFLINE_MARKER"),
    );
    check(
      (await source().inputValue()).includes("José Offline"),
      "PDF import lost accented name",
    );
    await saved();
    await page.screenshot({
      path: "/tmp/cv-offline-preview.png",
      fullPage: true,
    });
    await page
      .locator("form input[type=file]")
      .setInputFiles("scripts/fixtures/offline.docx");
    await page.waitForFunction(() =>
      document
        .querySelector("textarea")
        ?.value.includes("DOCX_OFFLINE_IMPORT_MARKER"),
    );
    check(
      (await source().inputValue()).includes("José Offline DOCX"),
      "Offline DOCX import lost accented text",
    );
    await saved();
    await page.getByRole("button", { name: "Duplicate", exact: true }).click();
    await page.waitForFunction(
      () =>
        document.querySelector('input[aria-label="Document title"]')?.value ===
        "Offline imported copy",
    );
    check(
      (await title().inputValue()) === "Offline imported copy",
      "Offline duplicate failed",
    );
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await page.waitForFunction(
      () =>
        document.querySelector('input[aria-label="Document title"]')?.value ===
        "Offline imported copy",
    );
    check(
      (await title().inputValue()) === "Offline imported copy",
      "Offline undo failed",
    );
    // Reopen in a new tab with the network still disabled.
    await page.close();
    page = await context.newPage();
    await page.goto(url);
    await title().waitFor();
    check(
      (await title().inputValue()) === "Offline imported copy",
      "Offline reopen lost active document",
    );
    await page
      .getByRole("complementary")
      .getByRole("button", { name: /^Offline B/ })
      .click();
    check(
      (await source().inputValue()) === "Offline source B",
      "Offline reopen lost second document",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await source().fill("Mobile offline edit");
    await saved();
    await page.reload();
    await source().waitFor();
    check(
      (await source().inputValue()) === "Mobile offline edit",
      "Mobile offline reload lost edits",
    );
    await page
      .getByRole("button", { name: "Download PDF", exact: true })
      .waitFor();
    await page.screenshot({
      path: "/tmp/cv-offline-mobile.png",
      fullPage: true,
    });
    check(errors.length === 0, "Browser errors: " + errors.join("; "));
    return {
      result: "PASS",
      cachedAssets: cached.length,
      checks:
        "offline reload/reopen, create/edit/save, independent documents, content/style persistence, PDF preview/export/import and long content, DOCX import, backup import with pending edits, duplicate/delete/undo, mobile reload",
    };
  } catch (error) {
    await page
      .screenshot({ path: "/tmp/cv-offline-failure.png", fullPage: true })
      .catch(() => {});
    throw new Error(
      String(error) +
        "\nBrowser errors: " +
        errors.join("; ") +
        "\nPage: " +
        (await page.locator("body").innerText()).slice(0, 2500),
    );
  } finally {
    await context.close();
  }
};

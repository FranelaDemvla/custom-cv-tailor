// Open the app, then run with playwright-cli run-code --filename=scripts/browser-storage-check.js.
// eslint-disable-next-line no-unused-expressions -- Playwright CLI evaluates this callback.
async (page) => {
  const browser = page.context().browser();
  const url = page.url();
  const context = await browser.newContext({ locale: "en-US" });
  const failedContext = await browser.newContext({ locale: "en-US" });
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  try {
    page = await context.newPage();
    await page.goto(url);
    await page
      .getByRole("button", { name: "New CV", exact: true })
      .first()
      .click();
    const source = page.getByRole("textbox", {
      name: "Current CV Text",
      exact: true,
    });
    await page
      .getByRole("textbox", { name: "Document title", exact: true })
      .fill("Storage recovery");
    await source.fill("Original saved source");
    await page.getByText(/^Saved/).waitFor();
    await page.evaluate(() => {
      const original = IDBDatabase.prototype.transaction;
      window.restoreCvTransactions = () => {
        IDBDatabase.prototype.transaction = original;
      };
      IDBDatabase.prototype.transaction = function (...args) {
        if (args[1] === "readwrite")
          throw new DOMException(
            "Synthetic storage quota exceeded",
            "QuotaExceededError",
          );
        return original.apply(this, args);
      };
    });
    await source.fill("Unsaved source retained for retry");
    await page
      .getByRole("button", { name: "Retry saving", exact: true })
      .waitFor();
    check(
      (await page.getByText(/^Saved/).count()) === 0,
      "Failed save displayed Saved",
    );
    check(
      (await source.inputValue()) === "Unsaved source retained for retry",
      "Storage error discarded edits",
    );
    const downloadEvent = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export backup", exact: true })
      .click();
    await (await downloadEvent).saveAs("/tmp/cv-storage-error-backup.json");
    await page.evaluate(() => window.restoreCvTransactions());
    await page
      .getByRole("button", { name: "Retry saving", exact: true })
      .click();
    await page.getByText(/^Saved/).waitFor();
    // Hide immediately during a new debounce window, then reopen to check commit.
    await source.fill("Background flush preserved edits");
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.getByText(/^Saved/).waitFor();
    await page.reload();
    await source.waitFor();
    check(
      (await source.inputValue()) === "Background flush preserved edits",
      "Retry/background save did not persist",
    );
    const readDocuments = () =>
      page.evaluate(
        () =>
          new Promise((resolve, reject) => {
            const request = indexedDB.open("custom-cv-library", 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result;
              const read = db
                .transaction("documents")
                .objectStore("documents")
                .getAll();
              read.onsuccess = () => {
                db.close();
                resolve(read.result);
              };
              read.onerror = () => {
                db.close();
                reject(read.error);
              };
            };
          }),
      );
    const beforeImport = await readDocuments();
    await page.evaluate(() => {
      const original = IDBObjectStore.prototype.add;
      let count = 0;
      window.restoreCvImport = () => {
        IDBObjectStore.prototype.add = original;
      };
      IDBObjectStore.prototype.add = function (...args) {
        if (++count === 2)
          throw new DOMException(
            "Synthetic backup import quota exceeded",
            "QuotaExceededError",
          );
        return original.apply(this, args);
      };
    });
    await page.evaluate(
      (payload) => {
        const input = document.querySelector("aside input[type=file]");
        const transfer = new DataTransfer();
        transfer.items.add(
          new File([payload], "backup.json", { type: "application/json" }),
        );
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      },
      JSON.stringify({
        format: "custom-cv-backup",
        version: 1,
        documents: [beforeImport[0], beforeImport[0]],
      }),
    );
    await page
      .getByRole("alert")
      .getByText("Synthetic backup import quota exceeded", { exact: true })
      .waitFor();
    check(
      (await readDocuments()).length === beforeImport.length,
      "Failed import left partially imported documents",
    );
    await page.evaluate(() => window.restoreCvImport());
    // Read failures must not present an empty, writable library.
    await failedContext.addInitScript(() => {
      const original = IDBFactory.prototype.open;
      window.restoreCvStorage = () => {
        IDBFactory.prototype.open = original;
      };
      IDBFactory.prototype.open = () => {
        throw new DOMException(
          "Synthetic storage unavailable",
          "SecurityError",
        );
      };
    });
    const failedPage = await failedContext.newPage();
    await failedPage.goto(url);
    await failedPage
      .getByRole("alert")
      .getByText("Your CV library could not be opened.", { exact: false })
      .waitFor();
    check(
      (await failedPage
        .getByRole("button", { name: "New CV", exact: true })
        .count()) === 0,
      "Read failure presented empty library",
    );
    await failedPage.evaluate(() => window.restoreCvStorage());
    await failedPage
      .getByRole("button", { name: "Retry saving", exact: true })
      .click();
    await failedPage
      .getByRole("button", { name: "New CV", exact: true })
      .first()
      .waitFor();
    return {
      result: "PASS",
      checks:
        "storage failure keeps edits and backup, retry commits, background flush, failed import rolls back, read error blocks false empty library and can retry",
    };
  } finally {
    await context.close();
    await failedContext.close();
  }
};

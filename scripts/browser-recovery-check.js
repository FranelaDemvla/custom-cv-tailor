// Run with playwright-cli run-code --filename=scripts/browser-recovery-check.js
// after opening the local app. Uses a fresh browser context and synthetic CVs.
// eslint-disable-next-line no-unused-expressions -- Playwright CLI evaluates this callback.
async page => {
  const url = page.url();
  const context = await page.context().browser().newContext({ locale: 'en-US' });
  page = await context.newPage();
  try {
    await page.goto(url);
    await page.getByRole('button', { name: 'New CV', exact: true }).first().click();
    const saved = p => p.getByText(/^Saved/).waitFor();
    await page.getByRole('textbox', { name: 'Document title', exact: true }).fill('Review A');
    await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).fill('Original source');
    await saved(page);
    const other = await page.context().newPage();
    await other.goto(page.url());
    await other.getByRole('textbox', { name: 'Current CV Text', exact: true }).fill('Other tab source');
    await saved(other);
    await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).fill('My conflicting edits');
    await page.getByRole('button', { name: 'Save my edits as a copy', exact: true }).waitFor();
    const guarded = await page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
    if (!guarded) throw new Error('Conflict did not preserve unload warning');
    await page.getByRole('button', { name: 'Save my edits as a copy', exact: true }).click();
    await page.getByRole('button', { name: 'Save my edits as a copy', exact: true }).waitFor({ state: 'hidden' });
    if (await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).inputValue() !== 'My conflicting edits') throw new Error('Copy lost edits');
    await page.reload();
    await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).waitFor();
    if (await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).inputValue() !== 'My conflicting edits') throw new Error('Copy not persisted');
    await page.getByRole('complementary').getByRole('button', { name: /^Review A Draft/ }).click();
    if (await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).inputValue() !== 'Other tab source') throw new Error('Original not reloaded');
    await other.getByRole('textbox', { name: 'Current CV Text', exact: true }).fill('Second external edit');
    await saved(other);
    await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).fill('Discard this conflict');
    await page.getByRole('button', { name: 'Discard my edits and reload saved version', exact: true }).click();
    await page.getByRole('button', { name: 'Discard my edits and reload saved version', exact: true }).waitFor({ state: 'hidden' });
    if (await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).inputValue() !== 'Second external edit') throw new Error('Reload failed');
    await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).fill('Editing works after recovery');
    await saved(page);
    await page.reload();
    await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).waitFor();
    if (await page.getByRole('textbox', { name: 'Current CV Text', exact: true }).inputValue() !== 'Editing works after recovery') throw new Error('Recovered revision not writable');
    await other.close();
    console.log('PASS: conflict warning, save as copy, persistence, reload, subsequent editing');
  } finally {
    await context.close();
  }
}

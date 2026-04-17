import { test, expect } from '@playwright/test';

//Hero Section
test.describe('Hero Section', () => {
    test.beforeEach(async({ page }) => {
        await page.goto('/');
    });

    test('displays the main heading', async({ page }) => {
        await expect(page.getByRole('heading', { name: 'Generate Professional' })).toBeVisible();
    });

    test('displays the Get Started Free link', async({ page }) => {
        await expect(page.getByRole('link', { name: 'Get Started Free'}).first()).toBeVisible();
    });

    test('displays the subheading text in hero section', async({ page }) => {
        await expect(page.getByText('Upload your CSV or Excel file')).toBeVisible();
    });

    test('How It Works link points to the correct section', async({ page }) => {
        await expect(page.getByRole('link', { name: 'See How It Works' })).toHaveAttribute('href','#how-it-works');
    });

    test('Get Started Free link navigates to signup page', async({ page }) => {
        await page.getByRole('link', { name: 'Get Started Free'}).first().click();

        await expect(page).toHaveURL('/signup');
    });

    test('scrolls to How It Works section when link is clicked', async({ page }) => {
        await page.getByRole('link', { name: 'See How It Works'}).click();

        await expect(page).toHaveURL('/#how-it-works');
    });
});

// Feature Card Section
test.describe('Feature Section', () => {
    test.beforeEach(async({ page }) => {
        await page.goto('/');
    });

    test('displays 3 feature card components', async({ page }) => {
        await expect(page.locator('#features').getByRole('heading', { level: 3 })).toHaveCount(3);
    });
})
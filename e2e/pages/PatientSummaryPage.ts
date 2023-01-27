import { expect } from '@playwright/test';
import { Page } from '@playwright/test';

export class PatientSummaryPage {
  constructor(readonly page: Page) {}

  readonly startVisitPrimaryButton = () => this.page.locator('text=Start visit');
  readonly actionsButton = () => this.page.locator('id=custom-actions-overflow-menu-trigger');
  readonly visitType = () => this.page.locator('text=Facility Visit');
  readonly startVisitSecondaryButton = () => this.page.getByRole('button', { name: 'Start visit' });
  readonly activeVisitLabel = () => this.page.locator('text=Active Visit');
  readonly endVisitButton = () => this.page.locator('text=End Visit');
  readonly alertEndVisitButton = () => this.page.getByRole('button', { name: 'End Visit' });

  async goto(patientUuid: string) {
    await this.page.goto(`patient/${patientUuid}/chart/Patient%20Summary`);
  }

  async startVisit() {
    await this.actionsButton().click();
    await this.startVisitPrimaryButton().click();
  }
  async fillInfo() {
    await this.visitType().click();
    await this.startVisitSecondaryButton().click();
  }
  //   async checkStatus(){

  //   }
  async endVisit() {
    await expect(this.activeVisitLabel).toMatch;
    await this.actionsButton().click({ timeout: 10000 });
    await this.endVisitButton().click({ timeout: 10000 });
    await this.alertEndVisitButton().click({ timeout: 10000 });
    await expect(this.activeVisitLabel).not.toMatch;
  }
}

import { Mission, IVRMenu } from '../types/game';

export const MISSIONS: Mission[] = [
  {
    id: 'mutual_obligations_breach',
    title: 'Dispute $1,420 Mutual Obligations Breach',
    crn: '409 821 736A',
    agency: 'Services Australia — JobSeeker Compliance',
    targetDepartment: 'JobSeeker & Mutual Obligations',
    penaltyNotice: 'PAYMENT SUSPENDED: Doctor medical certificate uploaded as PDF instead of physical paper scan.',
    description: 'Tell the agent: "My doctor medical certificate was submitted as a PDF instead of a TIFF scan. Please lift the suspension."',
    keyPhrases: ['medical certificate', 'doctor', 'PDF', 'exemption'],
  },
  {
    id: 'duplicate_abn_income',
    title: 'Report $412 Casual Earnings',
    crn: '715 390 182B',
    agency: 'Services Australia — Single Touch Payroll',
    targetDepartment: 'Income Reporting & Employment Separation',
    penaltyNotice: 'INCOME MISMATCH: Casual bar earnings flagged as redundant company ABN.',
    description: 'Tell the agent: "I worked casual bar shifts earning $412, but an old company ABN flagged it as a mismatch."',
    keyPhrases: ['casual earnings', 'bar shift', '412', 'ABN mismatch'],
  },
  {
    id: 'crn_identity_mixup',
    title: 'Unlink CRN Merged with Cousin in Dubbo',
    crn: '298 104 651C',
    agency: 'Services Australia — Identity Verification',
    targetDepartment: 'Identity & Concession Relink',
    penaltyNotice: 'DUPLICATE RECORD: Account merged with second cousin in regional NSW.',
    description: 'Tell the agent: "My CRN was accidentally merged with my cousin in Dubbo and sent to his bank account."',
    keyPhrases: ['cousin', 'Dubbo', 'wrong account', 'unlink'],
  },
  {
    id: 'workforce_biometric_outage',
    title: 'Appeal Workforce Australia Provider Outage',
    crn: '521 884 903D',
    agency: 'Workforce Australia — Compliance',
    targetDepartment: 'Provider Disputes & Demerit Appeals',
    penaltyNotice: 'DEMERIT POINT ISSUED: Recorded absent because provider scanner was offline.',
    description: 'Tell the agent: "I attended my compulsory interview on time, but the provider fingerprint scanner was offline."',
    keyPhrases: ['attended', 'scanner was down', 'demerit', 'fingerprint'],
  },
];

export const IVR_MENUS: Record<string, IVRMenu> = {
  MAIN_MENU: {
    id: 'MAIN_MENU',
    spokenPrompt:
      'Welcome to Services Australia. Please listen carefully as our menu options have recently changed. For JobSeeker and Mutual Obligations, press 1. For Age Pension and Carers, press 2. For Concession Cards and Healthcare, press 3. To report income or discuss a debt, press 4. Or say in a few words why you are calling today.',
    options: [
      { key: '1', label: 'JobSeeker & Obligations', voicePhrase: 'jobseeker', action: 'SUBMENU', targetMenu: 'JOBSEEKER_MENU' },
      { key: '2', label: 'Age Pension & Carers', voicePhrase: 'pension', action: 'SUBMENU', targetMenu: 'PENSION_MENU' },
      { key: '3', label: 'Concession Cards', voicePhrase: 'concession', action: 'SUBMENU', targetMenu: 'CONCESSION_MENU' },
      { key: '4', label: 'Report Income / Debt', voicePhrase: 'report income', action: 'SUBMENU', targetMenu: 'INCOME_DEBT_MENU' },
      { key: '0', label: 'Speak to an Operator', voicePhrase: 'operator', action: 'LOOP' },
    ],
  },
  JOBSEEKER_MENU: {
    id: 'JOBSEEKER_MENU',
    spokenPrompt:
      'JobSeeker Payment Enquiry. If you received a breach notice or demerit point, press 1. If your payment was suspended, press 2. To hear how to upload documents online using your myGov account without waiting on the phone, press 3. To return to the main menu, press 9.',
    options: [
      { key: '1', label: 'Dispute Breach / Demerit', voicePhrase: 'dispute', action: 'SUBMENU', targetMenu: 'DISPUTE_MENU' },
      { key: '2', label: 'Payment Suspended', voicePhrase: 'suspended', action: 'SUBMENU', targetMenu: 'DISPUTE_MENU' },
      { key: '3', label: 'Self Service Online Info', voicePhrase: 'mygov', action: 'LOOP' },
      { key: '9', label: 'Return to Main Menu', voicePhrase: 'main menu', action: 'SUBMENU', targetMenu: 'MAIN_MENU' },
    ],
  },
  DISPUTE_MENU: {
    id: 'DISPUTE_MENU',
    spokenPrompt:
      'To dispute a compliance action, please state the reason for your dispute clearly after the tone, or say "Transfer me to an officer".',
    options: [
      { key: '1', label: 'Hold for Specialist Officer', voicePhrase: 'transfer', action: 'HOLD_QUEUE' },
      { key: '2', label: 'Repeat Information', voicePhrase: 'repeat', action: 'REPEAT' },
      { key: '9', label: 'Main Menu', voicePhrase: 'main menu', action: 'SUBMENU', targetMenu: 'MAIN_MENU' },
    ],
  },
  CONCESSION_MENU: {
    id: 'CONCESSION_MENU',
    spokenPrompt:
      'Concession and Health Care Cards. All operators are currently busy. Did you know you can view your digital card in the Express Plus mobile app? To hold for an operator, press 1 or say "Operator".',
    options: [
      { key: '1', label: 'Hold for an Operator', voicePhrase: 'operator', action: 'HOLD_QUEUE' },
      { key: '9', label: 'Main Menu', voicePhrase: 'back', action: 'SUBMENU', targetMenu: 'MAIN_MENU' },
    ],
  },
  INCOME_DEBT_MENU: {
    id: 'INCOME_DEBT_MENU',
    spokenPrompt:
      'Employment Income and Debt Resolution. If you are reporting earnings for the current fortnight, press 1. If you are calling regarding a discrepancy notice, press 2. To hold for a compliance representative, press 3.',
    options: [
      { key: '1', label: 'Report Fortnight Earnings', voicePhrase: 'earnings', action: 'LOOP' },
      { key: '2', label: 'Discrepancy Notice', voicePhrase: 'discrepancy', action: 'HOLD_QUEUE' },
      { key: '3', label: 'Hold for Representative', voicePhrase: 'representative', action: 'HOLD_QUEUE' },
      { key: '9', label: 'Main Menu', voicePhrase: 'main menu', action: 'SUBMENU', targetMenu: 'MAIN_MENU' },
    ],
  },
  PENSION_MENU: {
    id: 'PENSION_MENU',
    spokenPrompt:
      'Pensions and Seniors Services. Current estimated wait time is higher than average. Please visit a service centre with your identity documents. Press 1 to return to the main menu.',
    options: [
      { key: '1', label: 'Return to Main Menu', voicePhrase: 'main menu', action: 'SUBMENU', targetMenu: 'MAIN_MENU' },
    ],
  },
};

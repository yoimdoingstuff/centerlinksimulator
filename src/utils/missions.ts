import { Mission, IVRMenu } from '../types/game';

export const MISSIONS: Mission[] = [
  {
    id: 'mutual_obligations_breach',
    title: 'JobSeeker - Medical Certificate Rejected',
    crn: '409 821 736A',
    agency: 'Services Australia — JobSeeker Compliance',
    targetDepartment: 'JobSeeker & Mutual Obligations',
    menuGuide: 'Press 1 (JobSeeker) ➔ Press 1 (Dispute Breach) ➔ Press 1 (Officer)',
    expectedMenuId: 'JOBSEEKER_MENU',
    penaltyNotice: 'PAYMENT SUSPENDED: Doctor medical certificate uploaded as PDF instead of physical paper scan.',
    description: 'Tell the agent: "My doctor medical certificate was submitted as a PDF instead of a paper scan. Please lift the suspension."',
    keyPhrases: ['medical certificate', 'doctor', 'pdf', 'exemption', 'sick', 'hospital'],
  },
  {
    id: 'duplicate_abn_income',
    title: 'Casual Earnings - Report $412 Bar Shifts',
    crn: '715 390 182B',
    agency: 'Services Australia — Single Touch Payroll',
    targetDepartment: 'Income Reporting & Employment Separation',
    menuGuide: 'Press 4 (Income & Debt) ➔ Press 1 (Earnings Dispute) ➔ Press 1 (Officer)',
    expectedMenuId: 'INCOME_DEBT_MENU',
    penaltyNotice: 'INCOME MISMATCH: Casual bar earnings flagged as redundant company ABN.',
    description: 'Tell the agent: "I worked casual bar shifts earning $412, but an old company ABN flagged it as a mismatch."',
    keyPhrases: ['casual earnings', 'bar shift', '412', 'abn mismatch', 'casual', 'hours', 'earnings'],
  },
  {
    id: 'carers_allowance_lost_mail',
    title: 'Carer Payment - Lost Medical Form in Mail',
    crn: '614 782 309F',
    agency: 'Services Australia — Carer Support Services',
    targetDepartment: 'Carer Payment & Medical Reviews',
    menuGuide: 'Press 2 (Pension & Carers) ➔ Press 1 (Carer Appeals) ➔ Press 1 (Officer)',
    expectedMenuId: 'PENSION_MENU',
    penaltyNotice: 'BENEFIT CANCELLED: Treating doctor verification questionnaire not received.',
    description: 'Tell the agent: "My mother\'s treating specialist mailed the completed SA332 form three weeks ago via Australia Post."',
    keyPhrases: ['carer', 'doctor form', 'mailed', 'australia post', 'treating doctor', 'mother', 'review'],
  },
  {
    id: 'rent_assistance_lease_rollover',
    title: 'Rent Assistance - Expired Fixed Lease Dispute',
    crn: '903 416 528H',
    agency: 'Services Australia — Accommodation Support',
    targetDepartment: 'Rent Assistance & Tenancy Verification',
    menuGuide: 'Press 3 (Concession & Rent) ➔ Press 1 (Rent Dispute) ➔ Press 1 (Officer)',
    expectedMenuId: 'CONCESSION_MENU',
    penaltyNotice: 'RENT ASSISTANCE STOPPED: 12-month fixed tenancy agreement expired.',
    description: 'Tell the agent: "My tenancy rolled over onto a continuing periodic month-to-month lease as permitted by state residential tenancies law."',
    keyPhrases: ['rent assistance', 'lease', 'periodic', 'month to month', 'landlord', 'tenancy', 'rent'],
  },
  {
    id: 'workforce_biometric_outage',
    title: 'Provider Outage - Fingerprint Scanner Offline',
    crn: '521 884 903D',
    agency: 'Workforce Australia — Compliance',
    targetDepartment: 'Provider Disputes & Demerit Appeals',
    menuGuide: 'Press 1 (JobSeeker) ➔ Press 1 (Dispute Breach) ➔ Press 1 (Officer)',
    expectedMenuId: 'JOBSEEKER_MENU',
    penaltyNotice: 'DEMERIT POINT ISSUED: Recorded absent because provider scanner was offline.',
    description: 'Tell the agent: "I attended my compulsory interview on time, but the provider fingerprint scanner was offline."',
    keyPhrases: ['attended', 'scanner was down', 'demerit', 'fingerprint', 'interview', 'on time', 'offline'],
  },
  {
    id: 'crn_identity_mixup',
    title: 'Identity Mixup - CRN Merged with Cousin in Dubbo',
    crn: '298 104 651C',
    agency: 'Services Australia — Identity Verification',
    targetDepartment: 'Identity & Concession Relink',
    menuGuide: 'Press 1 (JobSeeker) ➔ Press 1 (Dispute Breach) ➔ Press 1 (Officer)',
    expectedMenuId: 'JOBSEEKER_MENU',
    penaltyNotice: 'DUPLICATE RECORD: Account merged with second cousin in regional NSW.',
    description: 'Tell the agent: "My CRN was accidentally merged with my cousin in Dubbo and sent to his bank account."',
    keyPhrases: ['cousin', 'dubbo', 'wrong account', 'unlink', 'merged', 'bank'],
  },
  {
    id: 'dsp_impairment_table_dispute',
    title: 'DSP - Impairment Table Score Dispute',
    crn: '159 347 882G',
    agency: 'Services Australia — DSP Assessment Team',
    targetDepartment: 'Disability Medical Assessment & Appeals',
    menuGuide: 'Press 2 (Pension & Carers) ➔ Press 1 (Appeals) ➔ Press 1 (Officer)',
    expectedMenuId: 'PENSION_MENU',
    penaltyNotice: 'CLAIM REJECTED: Assigned 15 points under Table 2 instead of 20 points under Table 1.',
    description: 'Tell the agent: "My orthopaedic surgeon specialist report confirms severe permanent impairment of 20 points under Table 1."',
    keyPhrases: ['dsp', 'disability', 'impairment', 'table', 'points', 'specialist', 'permanent'],
  },
];

export const IVR_MENUS: Record<string, IVRMenu> = {
  MAIN_MENU: {
    id: 'MAIN_MENU',
    spokenPrompt:
      'Welcome to Centrelink. Please listen carefully as our menu options have recently changed. For JobSeeker and Mutual Obligations, press 1. For Age Pension and Carers, press 2. For Concession Cards and Healthcare, press 3. To report income or discuss a debt, press 4. Or say in a few words why you are calling today.',
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
  PENSION_MENU: {
    id: 'PENSION_MENU',
    spokenPrompt:
      'Age Pension and Carer Support. For urgent carer reviews or medical certification appeals, press 1. To request an income and assets schedule, press 2. To speak to an officer, press 0.',
    options: [
      { key: '1', label: 'Carer Review & Appeals', voicePhrase: 'carer', action: 'SUBMENU', targetMenu: 'DISPUTE_MENU' },
      { key: '2', label: 'Assets Schedule', voicePhrase: 'assets', action: 'LOOP' },
      { key: '0', label: 'Hold for Officer', voicePhrase: 'officer', action: 'HOLD_QUEUE' },
      { key: '9', label: 'Main Menu', voicePhrase: 'main menu', action: 'SUBMENU', targetMenu: 'MAIN_MENU' },
    ],
  },
  CONCESSION_MENU: {
    id: 'CONCESSION_MENU',
    spokenPrompt:
      'Concession Cards and Rent Assistance. If your rent assistance has been reduced or cancelled, press 1. For concession card re-issue, press 2. Or say "Transfer me to an officer".',
    options: [
      { key: '1', label: 'Rent Assistance Dispute', voicePhrase: 'rent', action: 'SUBMENU', targetMenu: 'DISPUTE_MENU' },
      { key: '2', label: 'Concession Card Re-issue', voicePhrase: 'card', action: 'LOOP' },
      { key: '0', label: 'Hold for Officer', voicePhrase: 'officer', action: 'HOLD_QUEUE' },
      { key: '9', label: 'Main Menu', voicePhrase: 'main menu', action: 'SUBMENU', targetMenu: 'MAIN_MENU' },
    ],
  },
  INCOME_DEBT_MENU: {
    id: 'INCOME_DEBT_MENU',
    spokenPrompt:
      'Income Reporting and Overpayment Disputes. If you have been notified of an employment mismatch or casual earning discrepancy, press 1. To make a payment, press 2.',
    options: [
      { key: '1', label: 'Earnings Mismatch Dispute', voicePhrase: 'earnings', action: 'SUBMENU', targetMenu: 'DISPUTE_MENU' },
      { key: '2', label: 'Make Payment', voicePhrase: 'pay', action: 'LOOP' },
      { key: '0', label: 'Hold for Officer', voicePhrase: 'officer', action: 'HOLD_QUEUE' },
      { key: '9', label: 'Main Menu', voicePhrase: 'main menu', action: 'SUBMENU', targetMenu: 'MAIN_MENU' },
    ],
  },
};

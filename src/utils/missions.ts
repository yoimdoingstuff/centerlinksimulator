import { Mission, IVRMenu } from '../types/game';

export const MISSIONS: Mission[] = [
  {
    id: 'mutual_obligations_breach',
    title: 'Dispute $1,420 Mutual Obligations Breach',
    crn: '409 821 736A',
    agency: 'Services Australia — JobSeeker Compliance',
    targetDepartment: 'JobSeeker & Mutual Obligations',
    penaltyNotice: 'PAYMENT SUSPENDED: Doctor medical certificate uploaded as PDF instead of physical paper scan.',
    description: 'Tell the agent: "My doctor medical certificate was submitted as a PDF instead of a paper scan. Please lift the suspension."',
    keyPhrases: ['medical certificate', 'doctor', 'pdf', 'exemption', 'sick', 'hospital'],
  },
  {
    id: 'duplicate_abn_income',
    title: 'Report $412 Casual Earnings',
    crn: '715 390 182B',
    agency: 'Services Australia — Single Touch Payroll',
    targetDepartment: 'Income Reporting & Employment Separation',
    penaltyNotice: 'INCOME MISMATCH: Casual bar earnings flagged as redundant company ABN.',
    description: 'Tell the agent: "I worked casual bar shifts earning $412, but an old company ABN flagged it as a mismatch."',
    keyPhrases: ['casual earnings', 'bar shift', '412', 'abn mismatch', 'casual', 'hours', 'earnings'],
  },
  {
    id: 'crn_identity_mixup',
    title: 'Unlink CRN Merged with Cousin in Dubbo',
    crn: '298 104 651C',
    agency: 'Services Australia — Identity Verification',
    targetDepartment: 'Identity & Concession Relink',
    penaltyNotice: 'DUPLICATE RECORD: Account merged with second cousin in regional NSW.',
    description: 'Tell the agent: "My CRN was accidentally merged with my cousin in Dubbo and sent to his bank account."',
    keyPhrases: ['cousin', 'dubbo', 'wrong account', 'unlink', 'merged', 'bank'],
  },
  {
    id: 'workforce_biometric_outage',
    title: 'Appeal Workforce Australia Provider Outage',
    crn: '521 884 903D',
    agency: 'Workforce Australia — Compliance',
    targetDepartment: 'Provider Disputes & Demerit Appeals',
    penaltyNotice: 'DEMERIT POINT ISSUED: Recorded absent because provider scanner was offline.',
    description: 'Tell the agent: "I attended my compulsory interview on time, but the provider fingerprint scanner was offline."',
    keyPhrases: ['attended', 'scanner was down', 'demerit', 'fingerprint', 'interview', 'on time', 'offline'],
  },
  {
    id: 'austudy_courseload_glitch',
    title: 'Appeal 74.9% Austudy Study Load Suspension',
    crn: '832 195 440E',
    agency: 'Services Australia — Higher Education & Austudy',
    targetDepartment: 'Student Payments & Study Load Assessment',
    penaltyNotice: 'PAYMENT CUT: University course recorded as 3 subjects (74.9% full-time load).',
    description: 'Tell the agent: "My university course is 75% full-time credit points, the electronic enrolment system had a rounding glitch."',
    keyPhrases: ['austudy', 'study load', 'university', 'full time', 'credit points', 'subjects', 'student'],
  },
  {
    id: 'carers_allowance_lost_mail',
    title: 'Restore Carer Allowance After Lost Review Form',
    crn: '614 782 309F',
    agency: 'Services Australia — Carer Support Services',
    targetDepartment: 'Carer Payment & Medical Reviews',
    penaltyNotice: 'BENEFIT CANCELLED: Treating doctor verification questionnaire not received.',
    description: 'Tell the agent: "My mother\'s treating specialist mailed the completed SA332 form three weeks ago via Australia Post."',
    keyPhrases: ['carer', 'doctor form', 'mailed', 'australia post', 'treating doctor', 'mother', 'review'],
  },
  {
    id: 'dsp_impairment_table_dispute',
    title: 'Dispute Disability Support Pension Impairment Score',
    crn: '159 347 882G',
    agency: 'Services Australia — DSP Assessment Team',
    targetDepartment: 'Disability Medical Assessment & Appeals',
    penaltyNotice: 'CLAIM REJECTED: Assigned 15 points under Table 2 instead of 20 points under Table 1.',
    description: 'Tell the agent: "My orthopaedic surgeon specialist report confirms severe permanent impairment of 20 points under Table 1."',
    keyPhrases: ['dsp', 'disability', 'impairment', 'table', 'points', 'specialist', 'permanent'],
  },
  {
    id: 'rent_assistance_lease_rollover',
    title: 'Reinstate Rent Assistance on Periodic Lease',
    crn: '903 416 528H',
    agency: 'Services Australia — Accommodation Support',
    targetDepartment: 'Rent Assistance & Tenancy Verification',
    penaltyNotice: 'RENT ASSISTANCE STOPPED: 12-month fixed tenancy agreement expired.',
    description: 'Tell the agent: "My tenancy rolled over onto a continuing periodic month-to-month lease as permitted by state residential tenancies law."',
    keyPhrases: ['rent assistance', 'lease', 'periodic', 'month to month', 'landlord', 'tenancy', 'rent'],
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

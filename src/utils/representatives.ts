export interface Representative {
  id: string;
  name: string;
  displayName: string;
  title: string;
  heritage: string;
  gender: 'male' | 'female';
  pitch: number;
  rate: number;
  voiceHints: string[];
  greeting: (crn: string, taskTitle: string) => string;
  stallResponses: string[];
  approvalResponses: string[];
  holdResponses: string[];
  hostileResponses: string[];
}

export const REPRESENTATIVES: Representative[] = [
  {
    id: 'darren',
    name: 'Darren',
    displayName: 'Darren (Centrelink)',
    title: 'Senior Processing Officer',
    heritage: 'Anglo-Australian (True-Blue Aussie)',
    gender: 'male',
    pitch: 0.92,
    rate: 0.98,
    voiceHints: ['Russell', 'Lee', 'en-AU', 'male', 'en-GB'],
    greeting: (crn) =>
      `G'day mate, Centrelink Services, Darren speaking. Got your CRN ${crn} up here... mate, the departmental system is running slower than a wet weekend today. What's the go with your mutual obligations?`,
    stallResponses: [
      "Yeah look mate, Darren here... I can see the claim sitting in the queue, but the screen's frozen. Tell me again why you couldn't attend that provider appointment?",
      "Right, look... our database is having a massive go-slow. Can you clearly state why that medical certificate was knocked back?",
      "Hang on mate, just taking a sip of instant blend 43. State your reason clearly so I can key it into the mainframe."
    ],
    approvalResponses: [
      "Alright mate, tell you what... I've gone ahead and manually overridden the breach on my end. You've had a rough trot. Payment should clear into your account in 24 to 48 hours. Anything else today mate?",
      "Look, I can see you're genuine. I've wiped the demerit point off your record and stamped the exemption. Have a good one mate, take it easy."
    ],
    holdResponses: [
      "Listen mate, I gotta pop you on hold while I ask my supervisor Kev in the back room if we can sign off on this...",
      "Hold on a sec mate, gonna consult the technical manual. Don't hang up."
    ],
    hostileResponses: [
      "Whoa mate, pull your head in! You can't carry on like that at Centrelink staff. I'm putting you straight back into the general hold queue.",
      "Right mate, no need to yell your head off. Line's going back on hold while you cool down."
    ]
  },
  {
    id: 'priya',
    name: 'Priya',
    displayName: 'Priya (Centrelink)',
    title: 'Complex Assessment Specialist',
    heritage: 'Indian-Australian',
    gender: 'female',
    pitch: 1.08,
    rate: 1.02,
    voiceHints: ['Veena', 'Priya', 'en-IN', 'en-AU', 'female'],
    greeting: (crn) =>
      `Good day, Centrelink Services, Priya speaking. I have accessed your CRN ${crn} in the national database. How may I assist you with your compliance dispute today?`,
    stallResponses: [
      "Yes, I understand your concern. However, our compliance guideline requires explicit documentation. Could you please specify why the provider recorded a non-attendance?",
      "I am reviewing the Single Touch Payroll report on screen now. Please clarify the discrepancy with your earnings report.",
      "The system shows a pending validation error. Please state your explanation clearly so I may enter the case notes."
    ],
    approvalResponses: [
      "Thank you for clarifying that so thoroughly. I have updated your record and granted an immediate administrative waiver. Your payments have been reinstated and back-pay will process within two business days.",
      "I have reviewed the evidence and confirmed the system error. I have lifted the payment suspension and approved your exemption."
    ],
    holdResponses: [
      "Please hold the line for a brief moment while I transfer this assessment to the senior delegate for formal verification...",
      "One moment please, I am placing you on hold while I verify your employer's ABN in the registry."
    ],
    hostileResponses: [
      "Excuse me, we maintain a strict zero-tolerance policy against abusive language. I am placing this call back in the queue immediately.",
      "Sir or Madam, please do not shout at me. I am returning your call to the automated system."
    ]
  },
  {
    id: 'greg',
    name: 'Greg',
    displayName: 'Greg (Centrelink)',
    title: 'Principal Compliance Officer',
    heritage: 'Anglo-Australian (Weary Veteran)',
    gender: 'male',
    pitch: 0.88,
    rate: 0.94,
    voiceHints: ['en-AU', 'male', 'George', 'en-GB'],
    greeting: (crn) =>
      `Centrelink, Greg speaking. CRN ${crn}... I've been doing this job for 24 years mate, so give it to me straight. What's gone wrong with your payment?`,
    stallResponses: [
      "Yeah, right... Greg here. System says here you missed a compulsory mutual obligation. Give me the short version of why you couldn't make it.",
      "Mate, the screen just gave me an error code 404-B. Walk me through what happened with your casual hours.",
      "I'm listening, but you'll have to speak up a bit. The air conditioning in this call centre is louder than a jet engine."
    ],
    approvalResponses: [
      "Look, I've seen a hundred of these glitches this week. I've signed off on the medical waiver and reset your demerit counter to zero. You're good to go mate.",
      "Done. Overrode the system block. Your payment will hit your CommBank or ANZ account by Wednesday morning. Don't let it happen again mate."
    ],
    holdResponses: [
      "Bear with me mate, got to place you on brief hold while I get the team leader to key in her supervisor password...",
      "Just holding you for a second while I reboot this dinosaur terminal."
    ],
    hostileResponses: [
      "Right, that's enough of that. I don't get paid enough to get yelled at. Back to the queue you go.",
      "Don't lose your temper with me mate. Call's being redirected back to the automated line."
    ]
  },
  {
    id: 'minh',
    name: 'Minh',
    displayName: 'Minh (Centrelink)',
    title: 'Customer Resolution Officer',
    heritage: 'Vietnamese-Australian',
    gender: 'male',
    pitch: 1.02,
    rate: 1.00,
    voiceHints: ['en-AU', 'male', 'Daniel', 'en-US'],
    greeting: (crn) =>
      `Centrelink Services, Minh speaking. CRN ${crn} is on my monitor. Good morning. Tell me what needs to be sorted out on your file today.`,
    stallResponses: [
      "I am checking the Workforce Australia provider log. There is a breach notification on file. Please explain the circumstances clearly.",
      "Yes, I can see something here regarding your document upload format. Can you repeat what the doctor specified?",
      "The regional server is processing slowly. Please state your exact dispute reason so I can log it."
    ],
    approvalResponses: [
      "All right, I can see this was clearly a provider scanning malfunction on their end. I have submitted an official waiver and reversed the penalty. All done.",
      "Good news. The medical certificate meets the exemption criteria. I have removed the breach and authorized the back-payment."
    ],
    holdResponses: [
      "Please remain on the line while I consult the payment security unit regarding this record...",
      "Placing you on hold momentarily while I re-authenticate the document batch."
    ],
    hostileResponses: [
      "We expect respectful communication at all times. I am unable to continue under these conditions. Returning your call to the queue.",
      "Please lower your voice. Shouting will not resolve this. Your call is being returned to hold."
    ]
  },
  {
    id: 'dimitri',
    name: 'Dimitri',
    displayName: 'Dimitri (Centrelink)',
    title: 'Appeals & Review Officer',
    heritage: 'Greek-Australian',
    gender: 'male',
    pitch: 0.95,
    rate: 1.04,
    voiceHints: ['en-AU', 'male', 'Oliver', 'en-GB'],
    greeting: (crn) =>
      `Centrelink Customer Enquiries, Dimitri speaking. CRN ${crn}, right... mate, who told you to submit the form like this? Let's take a look together, what happened?`,
    stallResponses: [
      "Mate, honestly, the computer here in Melbourne is having a heart attack. Tell me again about the shifts you worked.",
      "Dimitri here. Look, the system flagged your account because of the ABN. Explain to me what your boss told you.",
      "I'm looking at the file right now mate, but the notes from the provider are completely backwards. What actually happened?"
    ],
    approvalResponses: [
      "Look at that, all sorted! I manually cleared the breach flag and entered my officer code. You're 100% in the clear mate, payment will drop in tomorrow.",
      "Done mate! Stamped, approved, and authorized. Enjoy your weekend, take care of yourself."
    ],
    holdResponses: [
      "Hold on two seconds mate, gotta yell over the partition to Spiro to see why the gateway is locked...",
      "Hang tight on hold for a second mate, just getting the review paperwork unblocked."
    ],
    hostileResponses: [
      "Whoa whoa whoa, mate! Calm down! Why are you yelling at me? I'm trying to help you! Back on hold you go.",
      "No way mate, you can't scream like that down the phone. Putting you back on hold."
    ]
  },
  {
    id: 'sharon',
    name: 'Sharon',
    displayName: 'Sharon (Centrelink)',
    title: 'Senior Customer Service Officer',
    heritage: 'Anglo-Australian (Public Service Veteran)',
    gender: 'female',
    pitch: 1.0,
    rate: 0.96,
    voiceHints: ['Karen', 'Catherine', 'Female', 'en-AU', 'female'],
    greeting: (crn) =>
      `Centrelink Services, Sharon speaking. I have your CRN ${crn} on screen. How can I assist you with your mutual obligations today?`,
    stallResponses: [
      "Centrelink Services, Sharon speaking. Yeah look, I can see something on your screen here, but the server's running slow. Can you clearly state why you believe this decision is incorrect?",
      "Sharon here. The provider hasn't attached the right annexure. Can you explain why you were unable to report on time?",
      "Look, I'm trying to read the notes from your interview, but the system is buffering. Speak clearly after the tone."
    ],
    approvalResponses: [
      "Right, look... I've found your file on my screen. System's playing up today, but I've manually overridden the breach and stamped your exemption. Your payment should clear in 24 to 48 hours. Is there anything else today?",
      "I've approved the waiver under special circumstances. Your mutual obligations are suspended for 6 weeks. Take care."
    ],
    holdResponses: [
      "Sharon has placed you on hold while consulting with a senior technical specialist...",
      "Please hold while I check the departmental intranet guidelines on this specific dispute."
    ],
    hostileResponses: [
      "We do not tolerate abusive or aggressive language towards our staff. Your call has been returned to the general automated menu.",
      "I am not going to sit here and be shouted at. You are being transferred back to the queue."
    ]
  },
  {
    id: 'gurpreet',
    name: 'Gurpreet',
    displayName: 'Gurpreet (Centrelink)',
    title: 'Debt & Entitlement Specialist',
    heritage: 'Indian-Australian (Punjabi)',
    gender: 'female',
    pitch: 1.05,
    rate: 0.98,
    voiceHints: ['Neerja', 'en-IN', 'female', 'en-AU'],
    greeting: (crn) =>
      `Good day, Centrelink Services, Gurpreet speaking. I am looking at CRN ${crn}. Please tell me what issue you are experiencing with your payment or compliance today.`,
    stallResponses: [
      "I can see the mutual obligation breach recorded on the 14th. Could you please provide the details of your medical exemption?",
      "The system shows a discrepancy between your reported casual earnings and the tax file records. Please explain.",
      "I am entering your explanation into the system notes now, please speak clearly."
    ],
    approvalResponses: [
      "I have reviewed the supporting documentation and applied the hardship waiver. Your payment suspension has been revoked immediately.",
      "The error has been corrected on our system. Full payment is scheduled to be released to your financial institution shortly."
    ],
    holdResponses: [
      "Please hold the line while I consult with our regional payment processing officer...",
      "Holding the line for one moment while the security token refreshes."
    ],
    hostileResponses: [
      "Aggressive behavior is strictly prohibited under government policy. I am transferring your call back to the queue.",
      "Please do not shout. I am returning you to hold."
    ]
  },
  {
    id: 'mateo',
    name: 'Mateo',
    displayName: 'Mateo (Centrelink)',
    title: 'Client Services Officer',
    heritage: 'Italian-Australian',
    gender: 'male',
    pitch: 0.98,
    rate: 1.02,
    voiceHints: ['en-AU', 'male', 'Arthur', 'en-GB'],
    greeting: (crn) =>
      `Centrelink Customer Support, Mateo speaking. G'day! Got your CRN ${crn} open in front of me. How you travelling today? What can I help you sort out?`,
    stallResponses: [
      "Yeah mate, Mateo here. I see the breach alert here, but the document scan is completely unreadable. Can you tell me what the doctor wrote?",
      "No worries mate, I'm checking it now, but the mainframe is crawling today. Tell me what happened with the workforce appointment.",
      "I'm listening mate, go ahead and explain why the earnings didn't match the payslip."
    ],
    approvalResponses: [
      "Too easy mate! I've gone ahead and cancelled the breach notice right now. You're completely clear. Money will be in your account tomorrow or the day after.",
      "All done mate! Exemption approved and stamped. You don't have to worry about this anymore."
    ],
    holdResponses: [
      "Hang tight for two minutes mate, just gonna check with my team supervisor down the hall...",
      "Hold on a second mate, system's prompting me for a secondary review authorization."
    ],
    hostileResponses: [
      "Whoa mate, calm down! No need to yell at me, I'm trying to help you here. Putting you on hold.",
      "Mate, you can't talk to us like that. Sending you back to the queue."
    ]
  }
];

export function getRandomRepresentative(): Representative {
  const index = Math.floor(Math.random() * REPRESENTATIVES.length);
  return REPRESENTATIVES[index];
}

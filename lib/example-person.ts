import type { ChatMessage, Profile } from "@/lib/app-config";

/**
 * A fictional person, invented for demos. Not a real profile, not a real
 * transcript, and not based on anyone. Used by the "Try with an example person"
 * link on the start screen, which skips the conversation and goes straight to
 * generating the results.
 */
export const EXAMPLE_PERSON_NAME = "Ingrid Dahl, hospital pharmacist (invented)";

export const EXAMPLE_PERSON_FEELING = 4;

export const EXAMPLE_PERSON_PROFILE: Profile = {
  kind: "text",
  text: `Ingrid Dahl
Senior Clinical Pharmacist, Acute Medicine
Manchester, United Kingdom

About
Clinical pharmacist on an acute medical ward. Nineteen years in hospital pharmacy. Medicines safety, antimicrobial stewardship, and teaching the junior doctors who rotate through every four months.

Experience
Senior Clinical Pharmacist, Acute Medicine, Northern General NHS Trust, 2016 to present
Clinical Pharmacist, Care of the Elderly, Northern General NHS Trust, 2011 to 2016
Rotational Pharmacist, Riverside Teaching Hospitals, 2007 to 2011
Pre-registration Pharmacist, Riverside Teaching Hospitals, 2006 to 2007

Education
MSc Clinical Pharmacy, University of Manchester, 2013
MPharm Pharmacy, University of Manchester, 2006

Skills
Medicines reconciliation, Antimicrobial stewardship, Clinical governance, Patient safety, Teaching

Note: fictional profile, written for a demo.`,
};

export const EXAMPLE_PERSON_TRANSCRIPT: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "From your profile: nineteen years in hospital pharmacy, most of it on acute medicine, with medicines safety and teaching running through all of it. Let us start with what is not in there. What have you done that is not on LinkedIn: side projects, volunteering, things people come to you for?\n\n[[q=1]]",
  },
  {
    role: "user",
    content:
      "I rewrote the trust's insulin chart after we had two near misses, and it is still the one in use seven years later. I run an informal clinic for the junior doctors at four o'clock where they bring me the prescriptions they are unsure about. And I sit on the medicines safety group, but nobody outside the hospital would know any of that.",
  },
  {
    role: "assistant",
    content:
      "So you redesigned the chart the whole trust still prescribes insulin on, and you run the unofficial four o'clock surgery where the doctors bring you what worries them. Is that right? Next: which skills do you have that you have never listed?",
  },
  {
    role: "user",
    content:
      "Reading the gap between the chart and the person. If a frail eighty year old comes up from A and E on four new drugs, I already know two will clash with what the GP had them on, and that the GP record will not match the bag of pills the family brought in. Also saying no to a consultant without a row. And teaching, properly, at the bedside.",
  },
  {
    role: "assistant",
    content:
      "You read the gap between the chart and the life the person actually lives, you can refuse a senior colleague without it becoming a fight, and you teach at the bedside. Is that right? Which parts of your work give you energy, and which would you happily hand to AI tomorrow?",
  },
  {
    role: "user",
    content:
      "Teaching gives me energy, and the honest conversations with families about stopping medicines. What I would hand over tomorrow is the reconciliation paperwork, chasing GP surgeries for lists, and the audit spreadsheets nobody reads.",
  },
  {
    role: "assistant",
    content:
      "Teaching and the difficult family conversations are what you want more of, and the list chasing and audit spreadsheets are what you would give away. Is that right? What do you have to keep doing yourself to stay good at your work?",
  },
  {
    role: "user",
    content:
      "Seeing patients. The moment I stop walking the ward I lose the thing that makes me useful, which is knowing what a person on eleven medicines actually looks like. A man came in with a very high potassium result and the obvious answer was to treat it. He was walking and talking and nothing he was on explained it, so I asked for a repeat before we treated him. Normal. The first sample had sat in a pod for an hour. You only get that from being there.",
  },
  {
    role: "assistant",
    content:
      "You have to keep seeing patients, because the judgement that spared that man a treatment he did not need comes from being on the ward, not from the screen. Is that right? Last one: what matters in what comes next: freedom, stability, variety, impact, place?",
  },
  {
    role: "user",
    content:
      "Variety and impact, in that order. I am tired of the same ward. I want to stay in the north west because my children are at school here, and the income has to be reliable. But I do not need all of it from one employer any more.",
  },
  {
    role: "assistant",
    content:
      "Thank you. That is everything I needed, and there is a great deal in it.\n\n[[q=done]]",
  },
];

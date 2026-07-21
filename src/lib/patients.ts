export type TimelineEvent = {
  when: string;
  title: string;
  body: string;
};

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: "F" | "M";
  bed: string;
  doctor: string;
  bloodGroup: string;
  condition: string;
  diagnosis: string;
  status: string;
  risk: "Low" | "Moderate" | "High" | "Critical";
  admittedOn: string;
  vitals: { hr: number; sys: number; dia: number; spo2: number; temp: number; rr: number };
  aiSummary: string;
  timeline: TimelineEvent[];
};

export const PATIENTS: Patient[] = [
  {
    id: "P-1042",
    name: "Amelia Hart",
    age: 62,
    gender: "F",
    bed: "ICU-04",
    doctor: "Dr. Priya Menon",
    bloodGroup: "A+",
    condition: "Post-op cardiac (CABG)",
    diagnosis: "Post-op cardiac observation, rising sepsis risk",
    status: "Under observation",
    risk: "Moderate",
    admittedOn: "3 days ago",
    vitals: { hr: 82, sys: 118, dia: 74, spo2: 97, temp: 37.1, rr: 18 },
    aiSummary:
      "62F, post-op cardiac. Vitals mostly stable, but temperature and CRP trending upward over 48h. Suggest early sepsis workup: lactate, blood cultures, reassess in 2h.",
    timeline: [
      ["Today · 09:12", "AI risk score: Sepsis rising", "Lactate recheck ordered"],
      ["Today · 07:40", "Vitals checked", "HR 82 · SpO₂ 97 · Temp 37.1°C"],
      ["Yesterday", "Medication administered", "Ceftriaxone 1g IV"],
      ["2 days ago", "Lab report", "WBC 14.2, CRP 96 mg/L"],
      ["Admission", "Diagnosis", "Post-op cardiac observation, ward 3B"],
    ].map(([when, title, body]) => ({ when, title, body })),
  },
  {
    id: "P-1043",
    name: "James O'Neill",
    age: 71,
    gender: "M",
    bed: "ICU-12",
    doctor: "Dr. Aditi Rao",
    bloodGroup: "O+",
    condition: "Respiratory failure",
    diagnosis: "Community-acquired pneumonia with hypoxia",
    status: "Improving",
    risk: "High",
    admittedOn: "5 days ago",
    vitals: { hr: 96, sys: 128, dia: 82, spo2: 93, temp: 38.0, rr: 24 },
    aiSummary:
      "71M, respiratory case. SpO₂ improving on 4L O₂; chest X-ray shows resolving right lower lobe consolidation. Continue antibiotics and monitor ABG.",
    timeline: [
      ["Today · 08:20", "SpO₂ recovering", "94% on 4L O₂ (from 88% on room air)"],
      ["Today · 06:00", "AI respiratory analysis", "Predicted stable trajectory, low re-intubation risk"],
      ["Yesterday", "Chest X-ray", "Resolving right lower lobe consolidation"],
      ["2 days ago", "Oxygen therapy initiated", "Nasal cannula 4L/min"],
      ["Admission", "Chief complaint", "Fever, cough, dyspnea for 3 days"],
    ].map(([when, title, body]) => ({ when, title, body })),
  },
  {
    id: "P-1044",
    name: "Priya Shah",
    age: 54,
    gender: "F",
    bed: "ICU-03",
    doctor: "Dr. Anand Krishnan",
    bloodGroup: "B+",
    condition: "Hypertensive urgency",
    diagnosis: "Stage 2 hypertension with LVH",
    status: "Stable",
    risk: "Low",
    admittedOn: "2 days ago",
    vitals: { hr: 78, sys: 142, dia: 92, spo2: 98, temp: 36.8, rr: 16 },
    aiSummary:
      "54F, hypertensive urgency. BP trending down after amlodipine dose adjustment. ECG shows LVH but no acute ischemia. Continue current regimen and lifestyle counseling.",
    timeline: [
      ["Today · 10:00", "AI recommendation", "Add low-dose thiazide if BP >140/90 tomorrow"],
      ["Today · 08:00", "Daily BP trend", "Down from 168/104 to 142/92 over 36h"],
      ["Yesterday", "ECG review", "LVH pattern, no acute changes"],
      ["Yesterday", "Medication adjustment", "Amlodipine 5→10 mg daily"],
      ["Admission", "Chief complaint", "Headache, BP 178/108 in clinic"],
    ].map(([when, title, body]) => ({ when, title, body })),
  },
  {
    id: "P-1045",
    name: "Marcus Lee",
    age: 58,
    gender: "M",
    bed: "ICU-09",
    doctor: "Dr. Rohan Iyer",
    bloodGroup: "AB+",
    condition: "Type 2 diabetes with DKA",
    diagnosis: "Diabetic ketoacidosis, resolving",
    status: "Recovering",
    risk: "Moderate",
    admittedOn: "4 days ago",
    vitals: { hr: 88, sys: 122, dia: 76, spo2: 98, temp: 36.9, rr: 17 },
    aiSummary:
      "58M, diabetes monitoring. Glucose stabilized (110–160 mg/dL). Ketones cleared. Continue basal-bolus regimen and dietitian follow-up.",
    timeline: [
      ["Today · 09:30", "AI health insight", "Predicted stable glycemic recovery"],
      ["Today · 07:00", "Glucose trend", "Fasting 128 mg/dL (from 412 on admission)"],
      ["Yesterday", "Diet consultation", "Renal-friendly, low-GI plan started"],
      ["2 days ago", "Medication changes", "Switched IV insulin → basal-bolus subcutaneous"],
      ["Admission", "Chief complaint", "Polyuria, nausea, glucose 412, ketones ++"],
    ].map(([when, title, body]) => ({ when, title, body })),
  },
  {
    id: "P-1046",
    name: "Sofia García",
    age: 46,
    gender: "F",
    bed: "ICU-05",
    doctor: "Dr. Elena Marquez",
    bloodGroup: "A-",
    condition: "Post-surgical recovery",
    diagnosis: "S/p laparoscopic cholecystectomy",
    status: "Recovering",
    risk: "Low",
    admittedOn: "3 days ago",
    vitals: { hr: 74, sys: 116, dia: 72, spo2: 99, temp: 36.7, rr: 15 },
    aiSummary:
      "46F, post-op day 2. Pain well-controlled, wound clean and dry. Planned discharge within 24h if oral intake tolerated.",
    timeline: [
      ["Today · 09:00", "Recovery milestone", "Ambulating independently, tolerating diet"],
      ["Today · 07:30", "Wound assessment", "Clean, dry, no erythema"],
      ["Yesterday", "Pain management", "Transitioned IV → oral paracetamol"],
      ["2 days ago", "ICU observation", "Uneventful post-anesthesia recovery"],
      ["Admission", "Surgery completed", "Laparoscopic cholecystectomy, no complications"],
    ].map(([when, title, body]) => ({ when, title, body })),
  },
  {
    id: "P-1047",
    name: "Henrik Bakke",
    age: 68,
    gender: "M",
    bed: "ICU-11",
    doctor: "Dr. Neha Kapoor",
    bloodGroup: "O-",
    condition: "Acute ischemic stroke",
    diagnosis: "Left MCA territory infarct",
    status: "Under observation",
    risk: "High",
    admittedOn: "2 days ago",
    vitals: { hr: 84, sys: 148, dia: 88, spo2: 96, temp: 37.0, rr: 18 },
    aiSummary:
      "68M, stroke observation. NIHSS improving from 12 → 7 after tPA. CT confirms left MCA infarct, no hemorrhagic conversion. Begin early rehab.",
    timeline: [
      ["Today · 10:15", "Rehabilitation notes", "PT/OT initiated bedside, mild right arm weakness"],
      ["Today · 08:00", "AI stroke risk monitoring", "Low re-stroke risk on current DAPT"],
      ["Yesterday", "Neurology consult", "Recommend DAPT, statin, secondary prevention"],
      ["2 days ago", "CT scan", "Left MCA territory infarct, no hemorrhage"],
      ["Admission", "Emergency", "Sudden right-sided weakness, aphasia, tPA administered"],
    ].map(([when, title, body]) => ({ when, title, body })),
  },
  {
    id: "P-1048",
    name: "Sarah Williams",
    age: 63,
    gender: "F",
    bed: "ICU-12",
    doctor: "Dr. Emily Carter",
    bloodGroup: "O+",
    condition: "Chronic Kidney Disease (Stage 3)",
    diagnosis: "CKD Stage 3 with fluid overload",
    status: "Stable",
    risk: "Moderate",
    admittedOn: "4 days ago",
    vitals: { hr: 74, sys: 128, dia: 82, spo2: 98, temp: 36.8, rr: 17 },
    aiSummary:
      "63F, moderate renal impairment. Continue hydration management, renal diet, and scheduled laboratory monitoring. AI predicts stable recovery with continued monitoring.",
    timeline: [
      ["Today · 09:20", "AI prediction", "Stable renal trajectory on current regimen"],
      ["Today · 07:00", "Renal function", "Creatinine 1.9 (from 2.4), eGFR 42"],
      ["Yesterday", "Medication adjustment", "ACE-i reduced, loop diuretic optimized"],
      ["2 days ago", "Kidney ultrasound", "Bilateral small kidneys, no obstruction"],
      ["3 days ago", "Elevated creatinine", "Creatinine 2.4 mg/dL, K+ 5.1"],
      ["Admission", "Chief complaint", "Fatigue, bilateral pedal edema"],
    ].map(([when, title, body]) => ({ when, title, body })),
  },
  {
    id: "P-1049",
    name: "Michael Rodriguez",
    age: 52,
    gender: "M",
    bed: "Ward-08",
    doctor: "Dr. James Wilson",
    bloodGroup: "B+",
    condition: "Community Acquired Pneumonia",
    diagnosis: "Right lower lobe pneumonia",
    status: "Recovering",
    risk: "Low",
    admittedOn: "3 days ago",
    vitals: { hr: 82, sys: 122, dia: 80, spo2: 97, temp: 37.1, rr: 18 },
    aiSummary:
      "52M, responding well to antibiotic therapy. Continue respiratory monitoring and pulmonary rehab exercises. AI predicts discharge within 48–72 hours if stable.",
    timeline: [
      ["Today · 09:00", "AI prediction", "Discharge feasible within 48–72h if SpO₂ stable"],
      ["Today · 07:30", "Follow-up imaging", "Right lower lobe consolidation improving"],
      ["Yesterday", "SpO₂ trend", "Improved 92% → 97% on room air"],
      ["2 days ago", "IV antibiotics", "Ceftriaxone + azithromycin started"],
      ["2 days ago", "Chest X-ray", "Right lower lobe pneumonia confirmed"],
      ["Admission", "Emergency", "Fever 39.2°C, productive cough, dyspnea"],
    ].map(([when, title, body]) => ({ when, title, body })),
  },
];

export function getPatient(id: string): Patient {
  return PATIENTS.find((p) => p.id === id) ?? PATIENTS[0];
}
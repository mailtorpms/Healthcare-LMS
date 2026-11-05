/**
 * Emergency Medicine / Cardiology assessment.
 *
 * Every question follows the same shape as a row in `public.questions`
 * (see supabase/schema.sql): common columns plus a type-specific JSONB `payload`.
 *
 *   single  -> payload: { options: [{ id, text }], correctId }
 *   multi   -> payload: { options: [{ id, text }], correctIds: [], scoring: 'partial' | 'all_or_nothing' }
 *   dosage  -> payload: { template: 'text {{slotId}} text', answers: { slotId: 'token' }, tokens: ['token', ...] }
 */

const CITE = {
  stemi2013:
    "O'Gara PT, et al. 2013 ACCF/AHA Guideline for the Management of ST-Elevation Myocardial Infarction. Circulation. 2013;127(4):e362–e425.",
  acs2025:
    'Rao SV, et al. 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes. Circulation. 2025.',
  acls2020:
    'Panchal AR, et al. Part 3: Adult Basic and Advanced Life Support: 2020 AHA Guidelines for CPR and Emergency Cardiovascular Care. Circulation. 2020;142(16 suppl 2):S366–S468.',
  svt2015:
    'Page RL, et al. 2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia. Circulation. 2016;133(14):e506–e574.',
}

export const emCardiologyAssessment = {
  id: 'asm-em-cardio',
  courseId: 'crs-acs',
  title: 'EM / Cardiology: ACS & Resuscitation Competency',
  description:
    'Case-based assessment covering STEMI localisation, fibrinolytic eligibility, and ACLS/tachyarrhythmia pharmacology.',
  passingScore: 80,
  timeLimitMin: 20,
  questions: [
    {
      id: 'q-rv-stemi',
      type: 'single',
      points: 1,
      stem: 'What is the most likely diagnosis?',
      vignette:
        'A 62-year-old man presents with 45 minutes of crushing substernal chest pain, diaphoresis and light-headedness. BP 86/54 mmHg, HR 52, clear lung fields, JVP elevated. ECG: 2 mm ST elevation in II, III and aVF (III > II) with ST depression in I and aVL. A right-sided lead V4R shows 1.5 mm ST elevation.',
      payload: {
        options: [
          { id: 'a', text: 'Acute anterior STEMI (LAD occlusion)' },
          { id: 'b', text: 'Inferior STEMI with right ventricular infarction' },
          { id: 'c', text: 'Acute pericarditis' },
          { id: 'd', text: 'Massive pulmonary embolism with right heart strain' },
        ],
        correctId: 'b',
      },
      rationale:
        'ST elevation in II, III and aVF with reciprocal depression in I/aVL localises to the inferior wall; STE in III greater than II suggests a right coronary artery culprit. ST elevation ≥1 mm in V4R is the most sensitive ECG marker of RV involvement. The triad of hypotension, elevated JVP and clear lungs is classic for RV infarction. These patients are preload-dependent: avoid nitrates and diuretics, give IV fluid for hypotension, and pursue emergent reperfusion. Pericarditis produces diffuse STE with PR depression rather than territorial STE with reciprocal change.',
      citations: [CITE.stemi2013, CITE.acs2025],
    },
    {
      id: 'q-lytic-ci',
      type: 'multi',
      points: 1,
      stem: 'Select ALL findings that are ABSOLUTE contraindications to fibrinolytic therapy.',
      vignette:
        'A 70-year-old woman with a confirmed anterior STEMI presents to a rural hospital. The nearest PCI-capable centre is 3 hours away, so fibrinolysis is being considered.',
      payload: {
        options: [
          { id: 'a', text: 'History of intracranial haemorrhage 6 years ago' },
          { id: 'b', text: 'Ischaemic stroke 2 months ago' },
          { id: 'c', text: 'Current warfarin therapy (INR 2.1)' },
          { id: 'd', text: 'Suspected aortic dissection' },
          { id: 'e', text: 'Systolic BP of 185 mmHg on arrival' },
          { id: 'f', text: 'Active internal bleeding (melena today)' },
          { id: 'g', text: 'Age over 75 years' },
        ],
        correctIds: ['a', 'b', 'd', 'f'],
        scoring: 'partial',
      },
      rationale:
        'Absolute contraindications per ACC/AHA include: any prior intracranial haemorrhage, known structural cerebrovascular lesion or intracranial malignancy, ischaemic stroke within 3 months, suspected aortic dissection, active bleeding or bleeding diathesis (excluding menses), significant closed-head or facial trauma within 3 months, and intracranial/intraspinal surgery within 2 months. Oral anticoagulant use and SBP >180 mmHg (or DBP >110 mmHg) are RELATIVE contraindications. Advanced age alone is not a contraindication, although bleeding risk rises.',
      citations: [CITE.stemi2013, CITE.acs2025],
    },
    {
      id: 'q-acls-vf',
      type: 'dosage',
      points: 1,
      stem: 'Complete the ACLS protocol for refractory VF / pulseless VT by placing the correct dose tokens.',
      vignette:
        'A 55-year-old man in the ED is in ventricular fibrillation that persists after two defibrillation attempts. High-quality CPR is ongoing and IO access is established.',
      payload: {
        template:
          'Give epinephrine {{epiDose}} IV/IO, repeated every {{epiInterval}}. If VF persists after the third shock, give amiodarone {{amio1}} IV/IO bolus, followed by a second dose of {{amio2}} if needed.',
        answers: {
          epiDose: '1 mg',
          epiInterval: '3–5 minutes',
          amio1: '300 mg',
          amio2: '150 mg',
        },
        tokens: ['1 mg', '0.5 mg', '3–5 minutes', '10 minutes', '300 mg', '150 mg', '450 mg', '6 mg'],
      },
      rationale:
        'For shockable rhythms, epinephrine 1 mg IV/IO is given every 3–5 minutes (typically after the second shock). Amiodarone 300 mg IV/IO bolus is the first antiarrhythmic dose for shock-refractory VF/pVT, followed by 150 mg. Lidocaine 1–1.5 mg/kg is an acceptable alternative. 0.5 mg is the atropine dose for symptomatic bradycardia; 6 mg is the initial adenosine dose for SVT.',
      citations: [CITE.acls2020],
    },
    {
      id: 'q-svt-adenosine',
      type: 'dosage',
      points: 1,
      stem: 'Complete the treatment protocol for stable narrow-complex SVT.',
      vignette:
        'A 28-year-old woman presents with palpitations. HR 188, regular narrow-complex tachycardia, BP 118/74, alert and oriented. Vagal manoeuvres have failed.',
      payload: {
        template:
          'Give adenosine {{dose1}} rapid IV push through a proximal (antecubital) line followed by a {{flush}} saline flush. If no conversion within 1–2 minutes, give a second dose of {{dose2}}.',
        answers: {
          dose1: '6 mg',
          flush: '20 mL',
          dose2: '12 mg',
        },
        tokens: ['6 mg', '3 mg', '12 mg', '18 mg', '20 mL', '250 mL'],
      },
      rationale:
        'Adenosine has a half-life of under 10 seconds, so it must be pushed rapidly through a large proximal vein and chased with a ~20 mL saline flush. The adult initial dose is 6 mg, followed by 12 mg if the first dose is ineffective. Reduce the initial dose to 3 mg via central line, in heart-transplant recipients, or with concurrent dipyridamole/carbamazepine.',
      citations: [CITE.acls2020, CITE.svt2015],
    },
    {
      id: 'q-rv-mgmt',
      type: 'single',
      points: 1,
      stem: 'While awaiting the cath lab for the patient in Question 1, which intervention should be AVOIDED?',
      vignette:
        'The patient with inferior STEMI and RV involvement remains hypotensive (BP 84/50 mmHg) and is still having chest pain.',
      payload: {
        options: [
          { id: 'a', text: 'Aspirin 162–325 mg chewed' },
          { id: 'b', text: 'Cautious IV crystalloid bolus' },
          { id: 'c', text: 'Sublingual nitroglycerin 0.4 mg' },
          { id: 'd', text: 'Continuous cardiac monitoring with pacing pads applied' },
        ],
        correctId: 'c',
      },
      rationale:
        'RV infarction makes cardiac output preload-dependent. Nitrates (and other venodilators such as morphine, or diuretics) can precipitate profound hypotension and are avoided; nitrates are also contraindicated with SBP <90 mmHg. Aspirin should be given to all ACS patients without true allergy. A cautious fluid bolus supports RV preload, and pacing pads are prudent given the risk of AV block with RCA occlusion.',
      citations: [CITE.stemi2013, CITE.acs2025],
    },
  ],
}

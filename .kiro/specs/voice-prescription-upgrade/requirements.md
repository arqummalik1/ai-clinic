# Requirements Document

## Introduction

This spec upgrades MediSync's flagship **Voice-Based Prescription Generation** feature from "working" to "world-class." The feature already exists: doctors dictate a consultation, an AI layer (Groq Whisper + llama-3.3-70b) structures the speech into a prescription, the doctor reviews/edits, and the system saves the record, generates a branded PDF, and ships it to the patient via email/WhatsApp.

The upgrade targets four outcomes derived from reading the current codebase:

1. **Radical click reduction** toward a 2–3 interaction ideal (open patient → tap mic → speak → review → Generate), guided by the rule "if the doctor can speak it, the system should do it automatically."
2. **A real branding & template system** with a Super Admin → Clinic Admin → Doctor permission hierarchy, where the prescription's medical *structure* stays standardized while *visual appearance* is configurable. This includes rendering the clinic logo and doctor signature that the database already stores but the PDF generator currently ignores.
3. **Smarter AI auto-detection** of medicines (name + dosage + frequency + duration), lab tests, follow-ups, diagnosis, and advice, with confidence cues and allergy-conflict flagging, and a guarantee that the AI never invents medicines.
4. **A calm, trustworthy, mobile-and-desktop UX** that feels like talking to an assistant rather than filling a form.

This is an **enhancement of existing functionality**, not a rebuild. Requirements describe target system behavior and must respect the existing stack and engineering standards (Next.js 16, React 19, Supabase multi-tenant RLS, Groq AI, jsPDF, MVVM + Repository, no `any`, role + identity verification on every server action/API route, clinic tenant isolation, WCAG accessibility).

### Supporting (Non-Functional) Deliverables

The user requested several research/analysis artifacts that inform but are not themselves EARS requirements. These are tracked as design-phase deliverables and referenced here for traceability:

- **D1. Competitor Research Report** — Top 5 global and Top 5 Indian voice/AI medical documentation & prescription platforms, covering dictation start, click counts, speech→prescription workflow, medicine/lab/follow-up entry, history handling, corrections, finalization, PDF generation, branding, mobile vs desktop, smoothness factors, and customer sentiment.
- **D2. Feature Comparison Matrix** — Feature | Competitor | Our Product | Gap | Recommendation, across Dictation Flow, Medicine Entry, Lab Tests, Follow-Ups, Prescription Generation, Editing, PDF Export.
- **D3. UX Gap Analysis** — current vs best-in-class friction points, unnecessary clicks, workflow interruptions, missing automations, UX inconsistencies.
- **D4. Click Reduction Plan** — enumerated list of every removable click mapped to the 2–3 click ideal.
- **D5. World-Class Voice Prescription Blueprint** — the redesigned end-to-end voice workflow.
- **D6. Prioritized Roadmap** — Quick Wins (1–2 wks), Medium-Term (1–2 mo), Advanced AI (3–6 mo), Industry-Leading (future).

These will be produced in the design document. The requirements below specify the *functional behavior* the upgrade must deliver.

## Glossary

- **Voice_Prescription_System**: The end-to-end feature comprising dictation capture, AI structuring, review/edit, persistence, PDF generation, and delivery. Implemented primarily in `VoicePrescriptionFlow.tsx` and `actions.ts`.
- **Dictation_Engine**: The component that captures the doctor's speech, either via the browser Web Speech API (live transcript) or the audio-recorder fallback routed through Groq Whisper transcription.
- **AI_Structuring_Service**: The service behind `/api/ai/prescription` that converts a transcript into a `StructuredPrescription` (diagnosis, chief complaint, medicines, lab tests, advice, follow-up, clinical summary, vitals).
- **Prescription_Editor**: The review/edit UI (`PrescriptionEditor.tsx`) where the doctor verifies and corrects AI output before generation.
- **PDF_Generator**: The component (`generatePrescriptionPDF.ts`) that renders the final prescription PDF.
- **Branding_System**: The configuration subsystem that governs prescription visual appearance (logos, signatures, header/footer layout, colors, fonts) without altering medical structure.
- **Prescription_Template**: A reusable layout definition (header layout, footer layout, visual styling) selectable by clinics and applied at PDF generation.
- **Template_Registry**: The persistent store of master and clinic-customized templates and branding settings.
- **Super_Admin**: A user with `role = "super_admin"`; manages master templates and global branding defaults across all clinics.
- **Clinic_Admin**: A user with `role = "clinic_admin"`; manages branding and template selection for their own clinic only.
- **Doctor**: A user with `role = "doctor"`; dictates prescriptions and, where permitted, customizes personal header/footer/signature details.
- **Branding_Permission**: A per-doctor flag governing whether a Doctor may customize their own prescription appearance fields.
- **Confidence_Score**: A normalized 0–1 measure the AI_Structuring_Service attaches to each extracted field indicating extraction certainty.
- **Low_Confidence_Item**: Any extracted field whose Confidence_Score is below the configured verification threshold.
- **Allergy_Conflict**: A condition where an AI-detected medicine matches one of the patient's recorded allergies.
- **Standardized_Structure**: The fixed set and ordering of medically required prescription sections (patient identity, complaint, diagnosis, medicines, lab tests, advice, follow-up, signature) that must remain constant regardless of branding.
- **Click**: A single discrete user interaction (tap, click, or keypress) required to advance the workflow, excluding speech input and free-text editing keystrokes.
- **Core_Flow**: The path from an opened patient context to a generated prescription: open patient → start mic → speak → review → Generate.
- **Tenant_Isolation**: The guarantee that a user can only read or write data belonging to their own `clinic_id`.

## Requirements

### Requirement 1: Streamlined Core Dictation Flow

**User Story:** As a Doctor, I want to start dictating with a single tap and reach a generated prescription in two to three interactions, so that prescribing feels effortless and fast.

#### Acceptance Criteria

1. WHEN a Doctor opens the Voice_Prescription_System with a patient already in context, THE Voice_Prescription_System SHALL present a single primary control to begin dictation without requiring a prior mode selection.
2. WHEN a Doctor activates the primary dictation control, THE Dictation_Engine SHALL begin capturing speech within 1 second.
3. THE Voice_Prescription_System SHALL limit the Core_Flow from opened patient context to a generated prescription to a maximum of 3 Clicks, excluding speech input and free-text corrections.
4. WHILE the Dictation_Engine is capturing speech, THE Voice_Prescription_System SHALL display the live transcript and the structured prescription updating in the same view without requiring navigation to a separate screen.
5. WHERE the browser does not support live speech recognition, THE Voice_Prescription_System SHALL fall back to audio recording and Groq Whisper transcription without requiring the Doctor to choose the fallback manually.
6. WHEN a Doctor completes dictation, THE Voice_Prescription_System SHALL present a single Generate control that saves the prescription, generates the PDF, and triggers configured delivery.

### Requirement 2: Consolidated Mode and Settings Handling

**User Story:** As a Doctor, I want the system to handle dictation modes and timing automatically, so that I am not distracted by configuration toggles during a consultation.

#### Acceptance Criteria

1. THE Voice_Prescription_System SHALL select the dictation capture method automatically based on browser capability rather than exposing a manual dictation-versus-recording toggle in the Core_Flow.
2. WHERE a Doctor opens advanced settings, THE Voice_Prescription_System SHALL allow configuration of microphone auto-stop behavior and AI trigger delay.
3. WHEN a Doctor changes an advanced setting, THE Voice_Prescription_System SHALL persist the setting for that Doctor and apply it to subsequent dictation sessions.
4. WHILE a dictation session is active, THE Voice_Prescription_System SHALL keep advanced settings out of the primary interaction path.
5. IF the microphone receives no speech for the configured auto-stop interval, THEN THE Dictation_Engine SHALL pause capture and indicate that capture has paused.

### Requirement 3: Automatic Medicine Detection

**User Story:** As a Doctor, I want spoken medicine phrases turned into complete structured entries, so that I do not have to type medicine fields manually.

#### Acceptance Criteria

1. WHEN a Doctor speaks a medicine with a dosage value (for example "Paracetamol 650"), THE AI_Structuring_Service SHALL produce a medicine entry containing name and dosage.
2. WHEN a Doctor speaks frequency or duration for a medicine (for example "twice a day for five days"), THE AI_Structuring_Service SHALL populate the frequency and duration fields of the corresponding medicine entry.
3. WHEN a Doctor speaks multiple medicines in one statement, THE AI_Structuring_Service SHALL produce one separate medicine entry per medicine.
4. IF a Doctor speaks a medicine without an explicit dosage, THEN THE AI_Structuring_Service SHALL set the dosage field to "As directed".
5. THE AI_Structuring_Service SHALL include only medicines the Doctor actually stated and SHALL NOT add medicines that were not spoken.
6. WHERE a detected medicine name matches a known medicine reference, THE AI_Structuring_Service SHALL normalize the displayed name to the matched reference spelling.

### Requirement 4: Automatic Lab Test, Follow-Up, Diagnosis, and Advice Detection

**User Story:** As a Doctor, I want lab tests, follow-up timing, diagnosis, and advice captured from my speech, so that the whole prescription is populated without manual entry.

#### Acceptance Criteria

1. WHEN a Doctor speaks one or more lab tests (for example "CBC and LFT"), THE AI_Structuring_Service SHALL produce one separate lab test entry per named test.
2. WHEN a Doctor speaks a follow-up interval (for example "review after 7 days"), THE AI_Structuring_Service SHALL set the follow-up value to the stated number of days.
3. WHEN a Doctor speaks a diagnosis (for example "likely viral fever"), THE AI_Structuring_Service SHALL populate the diagnosis field with the stated diagnosis.
4. WHEN a Doctor speaks patient advice (for example "drink plenty of water and rest"), THE AI_Structuring_Service SHALL populate the advice field with the stated advice.
5. IF the transcript contains no follow-up interval, THEN THE AI_Structuring_Service SHALL set the follow-up value to null.
6. WHEN a Doctor speaks physical vitals (for example "BP 120 over 80"), THE AI_Structuring_Service SHALL populate the corresponding numeric vitals fields and SHALL set unmentioned vitals fields to null.

### Requirement 5: Confidence Indicators and Verification Cues

**User Story:** As a Doctor, I want the system to flag uncertain extractions, so that I can quickly verify or correct them before generating the prescription.

#### Acceptance Criteria

1. THE AI_Structuring_Service SHALL attach a Confidence_Score to each extracted prescription field.
2. WHERE an extracted field is a Low_Confidence_Item, THE Prescription_Editor SHALL display a visual verification cue on that field.
3. WHEN the Prescription_Editor displays Low_Confidence_Items, THE Prescription_Editor SHALL allow the Doctor to confirm or correct each flagged field.
4. WHEN a Doctor edits a flagged field, THE Prescription_Editor SHALL clear the verification cue for that field.

### Requirement 6: Allergy Conflict Flagging

**User Story:** As a Doctor, I want to be warned when a detected medicine conflicts with the patient's recorded allergies, so that I avoid prescribing a harmful medicine.

#### Acceptance Criteria

1. WHEN the AI_Structuring_Service detects a medicine that matches a recorded patient allergy, THE Voice_Prescription_System SHALL flag the medicine as an Allergy_Conflict in the Prescription_Editor.
2. THE Voice_Prescription_System SHALL retain a medicine flagged as an Allergy_Conflict in the prescription rather than removing it automatically.
3. IF a prescription contains an unresolved Allergy_Conflict, THEN THE Voice_Prescription_System SHALL require explicit Doctor acknowledgment before generating the prescription.
4. WHERE a patient has no recorded allergies, THE Voice_Prescription_System SHALL generate the prescription without an allergy acknowledgment step.

### Requirement 7: Voice and Tap Corrections

**User Story:** As a Doctor, I want to correct any field by voice or by tapping, so that fixing AI output is as fast as speaking it.

#### Acceptance Criteria

1. THE Prescription_Editor SHALL allow the Doctor to edit any structured prescription field by direct tap-and-type interaction.
2. WHILE dictation is active, WHEN a Doctor speaks additional content, THE AI_Structuring_Service SHALL merge the new content into the existing structured prescription without discarding previously confirmed fields.
3. WHEN a Doctor removes a medicine or lab test entry, THE Prescription_Editor SHALL remove only the targeted entry and preserve all other entries.
4. WHEN a Doctor edits a vitals field that affects BMI, THE Prescription_Editor SHALL recalculate BMI from the current weight and height values.

### Requirement 8: Standardized Medical Structure

**User Story:** As a Clinic_Admin, I want every prescription to follow the same medical structure regardless of branding, so that prescriptions remain professional and medically compliant.

#### Acceptance Criteria

1. THE PDF_Generator SHALL render the Standardized_Structure sections in a fixed order on every prescription regardless of the applied Prescription_Template.
2. WHERE branding settings are applied, THE Branding_System SHALL change only visual appearance and SHALL NOT add, remove, or reorder Standardized_Structure sections.
3. THE PDF_Generator SHALL exclude the internal clinical summary from the printable prescription PDF.
4. IF a required Standardized_Structure section has no content, THEN THE PDF_Generator SHALL render the section with an explicit empty indicator rather than omitting the section.

### Requirement 9: Clinic Logo and Doctor Signature Rendering

**User Story:** As a Doctor, I want my signature and my clinic's logo to appear on the printed prescription, so that the document looks authentic and branded.

#### Acceptance Criteria

1. WHERE a clinic has a stored logo, THE PDF_Generator SHALL render the clinic logo in the prescription header.
2. WHERE a Doctor has a stored signature image, THE PDF_Generator SHALL render the signature image above the signature line.
3. IF a clinic logo is configured but cannot be loaded, THEN THE PDF_Generator SHALL render the prescription with a text-based clinic name in place of the logo.
4. IF a Doctor signature is configured but cannot be loaded, THEN THE PDF_Generator SHALL render the signature line without the signature image.

### Requirement 10: Super Admin Master Templates and Global Branding

**User Story:** As a Super_Admin, I want to create master prescription templates and configure global branding defaults, so that all clinics start from a consistent, professional baseline.

#### Acceptance Criteria

1. WHERE a user has the Super_Admin role, THE Branding_System SHALL allow creation, editing, and deletion of master Prescription_Templates.
2. THE Branding_System SHALL allow a Super_Admin to configure global branding defaults including header layout, footer layout, and global visual styling.
3. WHEN a Super_Admin saves a master Prescription_Template, THE Template_Registry SHALL make the template available for selection by all clinics.
4. IF a user without the Super_Admin role attempts to create or modify a master Prescription_Template, THEN THE Branding_System SHALL reject the request and return an authorization error.
5. THE Branding_System SHALL verify the caller's identity and Super_Admin role on the server before performing any master template operation.

### Requirement 11: Clinic Admin Branding Customization

**User Story:** As a Clinic_Admin, I want to customize my clinic's branding and select a template, so that prescriptions reflect my clinic's identity.

#### Acceptance Criteria

1. WHERE a user has the Clinic_Admin role, THE Branding_System SHALL allow the Clinic_Admin to upload a clinic logo, edit clinic details, and select an available Prescription_Template for their own clinic.
2. THE Branding_System SHALL restrict a Clinic_Admin's branding changes to clinics matching the Clinic_Admin's own `clinic_id`.
3. IF a Clinic_Admin attempts to modify branding for a clinic other than their own, THEN THE Branding_System SHALL reject the request and return an authorization error.
4. WHEN a Clinic_Admin selects a Prescription_Template, THE Branding_System SHALL apply that template to prescriptions generated for that clinic.
5. THE Branding_System SHALL verify the caller's identity, Clinic_Admin role, and `clinic_id` on the server before performing any clinic branding operation.

### Requirement 12: Permission-Gated Doctor Customization

**User Story:** As a Doctor with branding permission, I want to customize my own header, footer, signature, and credentials, so that my prescriptions carry my professional details.

#### Acceptance Criteria

1. WHERE a Doctor has been granted Branding_Permission, THE Branding_System SHALL allow the Doctor to customize their name, qualification, registration number, contact details, signature, header layout, and footer layout.
2. IF a Doctor without Branding_Permission attempts to modify personal branding fields, THEN THE Branding_System SHALL reject the request and return an authorization error.
3. THE Branding_System SHALL constrain Doctor customization to visual appearance and credential fields and SHALL NOT allow changes to the Standardized_Structure.
4. THE Branding_System SHALL verify the caller's identity, Doctor role, and Branding_Permission on the server before performing any Doctor branding operation.
5. WHEN a Doctor saves permitted branding changes, THE Branding_System SHALL apply the changes to that Doctor's subsequently generated prescriptions.

### Requirement 13: Branding Hierarchy Resolution

**User Story:** As a product owner, I want branding settings to resolve predictably across the Super Admin, Clinic, and Doctor levels, so that the final prescription appearance is deterministic.

#### Acceptance Criteria

1. WHEN the PDF_Generator generates a prescription, THE Branding_System SHALL resolve the effective branding by applying Super_Admin global defaults, then Clinic_Admin clinic settings, then permitted Doctor customizations in that order.
2. WHERE a Doctor has not customized a branding field, THE Branding_System SHALL apply the clinic-level value for that field.
3. WHERE a clinic has not customized a branding field, THE Branding_System SHALL apply the Super_Admin global default for that field.
4. THE Branding_System SHALL produce the same effective branding for the same combination of Super Admin, clinic, and Doctor settings on every generation.

### Requirement 14: Mobile and Desktop Parity

**User Story:** As a Doctor, I want the same fast voice workflow on mobile and desktop, so that I can prescribe from any device.

#### Acceptance Criteria

1. THE Voice_Prescription_System SHALL provide the Core_Flow on both mobile and desktop viewports.
2. WHERE the viewport is a mobile width, THE Voice_Prescription_System SHALL present the dictation control and live structured prescription in a single-column layout without horizontal scrolling.
3. THE Voice_Prescription_System SHALL keep the maximum Core_Flow Click count identical on mobile and desktop.
4. THE Voice_Prescription_System SHALL meet WCAG contrast and keyboard-navigability standards for all interactive controls on both mobile and desktop.

### Requirement 15: Tenant Isolation and Authorization

**User Story:** As a security stakeholder, I want every voice prescription and branding operation isolated to its clinic and verified by role, so that patient data and clinic configuration stay protected.

#### Acceptance Criteria

1. THE Voice_Prescription_System SHALL verify the caller's identity and role on the server before performing any prescription save, PDF generation, or delivery operation.
2. WHEN the Voice_Prescription_System reads or writes patient, prescription, or branding data, THE Voice_Prescription_System SHALL restrict the operation to records matching the caller's `clinic_id`.
3. IF a caller requests prescription or branding data for a clinic other than their own, THEN THE Voice_Prescription_System SHALL reject the request and return an authorization error.
4. THE Voice_Prescription_System SHALL exclude secrets, tokens, and patient identifying values from application logs.

### Requirement 16: Reliable Generation and Delivery

**User Story:** As a Doctor, I want prescription generation and delivery to either fully succeed or fully roll back, so that I never end up with a half-saved record.

#### Acceptance Criteria

1. WHEN a Doctor triggers Generate, THE Voice_Prescription_System SHALL save the prescription, generate the PDF, and store the PDF before reporting success.
2. IF PDF generation or storage fails after the prescription record is created, THEN THE Voice_Prescription_System SHALL remove the created prescription record and report an error.
3. WHEN a prescription is generated with a follow-up interval, THE Voice_Prescription_System SHALL create a follow-up record scheduled from the follow-up interval.
4. WHEN a prescription is generated with vitals present, THE Voice_Prescription_System SHALL record the vitals against the patient.
5. WHERE patient contact details and delivery toggles are present, THE Voice_Prescription_System SHALL deliver the PDF over the configured channels and record the delivery outcome.
6. IF a delivery channel fails, THEN THE Voice_Prescription_System SHALL record the failure and SHALL still report the prescription as saved.

### Requirement 17: Prescription Round-Trip Integrity

**User Story:** As a Doctor, I want the prescription I reviewed to be exactly what gets stored and printed, so that the record is trustworthy.

#### Acceptance Criteria

1. WHEN a structured prescription is saved and then reloaded, THE Voice_Prescription_System SHALL produce a prescription whose diagnosis, complaint, medicines, lab tests, advice, follow-up, and vitals are equivalent to the saved prescription.
2. THE PDF_Generator SHALL render every medicine, lab test, advice item, and follow-up present in the reviewed prescription.
3. THE Voice_Prescription_System SHALL persist the raw transcript and the transcription language alongside the stored prescription.

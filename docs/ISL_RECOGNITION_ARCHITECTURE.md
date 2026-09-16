# SignConnect — Continuous ISL Recognition Architecture

> **Status:** Architecture planning. No recognition model or training pipeline has been implemented yet.

---

## 1. Product Recognition Goal
Defines the end-to-end objective of translating real-time Indian Sign Language (ISL) gestures and continuous expressions into accessible text and spoken output. This section documents the target vocabulary, phrase-level comprehension goals, and real-time latency thresholds required for seamless communication.

## 2. Target Scope & Overview
SignConnect aims to provide assistive real-time two-way communication between Deaf/Hard-of-Hearing individuals and non-signers. The system transitions from single-frame gesture classification to full sentence-level continuous ISL translation, honoring the unique grammatical structures, spatial markers, and non-manual expressions inherent in Indian Sign Language.

## 3. Dataset Strategy
Outlines the acquisition, curation, and validation roadmap for high-quality Indian Sign Language corpora across diverse signers. It addresses representative coverage across lexical categories, fingerspelling alphabets, regional dialects, and natural signing variations.

- INCLUDE — isolated Indian Sign Language recognition dataset
- ISLTranslate — continuous ISL-English sentence/phrase dataset
- ISL-CSLTR — continuous/sentence-level ISL dataset
- iSign — ISL translation dataset

| Dataset | Type | Approximate Scale | Current Stated License/Terms | Commercial Training Status | Main Limitation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **INCLUDE** | Primarily isolated ISL recognition | Requires verification | CC BY 4.0 | Potentially usable subject to verification | Primarily isolated signs; geographic/representation limitations noted by the dataset documentation. |
| **ISLTranslate** | Continuous ISL | 31,222 ISL-English sentence/phrase pairs | CC-BY-NC | Research / non-commercial; separate permission required for commercial use | Not suitable for commercial training under the currently stated terms. |
| **ISL-CSLTR** | Continuous/sentence-level ISL | 700 annotated videos; 18,863 sentence-level frames; 1,036 word-level images; 100 spoken-language sentences; 7 signers | CC BY 4.0 | Potentially useful subject to rights verification | Requires independent verification of underlying media rights, signer/privacy considerations, and whether the published licence covers the intended commercial use. |
| **iSign** | ISL translation | Requires verification | CC BY-NC-SA 4.0 | Research / non-commercial; not for commercial use under current stated terms | Gated dataset and current terms restrict commercial use. |

> **Warning:** Repository/code licensing and dataset/media licensing are not necessarily the same thing. Before production use, SignConnect must separately verify the dataset licence, underlying video/media rights, signer consent and privacy requirements, attribution requirements, and commercial-use restrictions.

Public availability or download access must not be treated as permission for commercial training.

These datasets will be evaluated for research, benchmarking, and potential pretraining. Production/commercial use requires separate verification of dataset licences, underlying media rights, signer consent, attribution requirements, and commercial-use restrictions.

## 4. Dataset Licensing and Rights
Documents the legal, ethical, and licensing frameworks governing all training and validation data sources. This section ensures full compliance with open-access terms, academic research licenses, and explicit consent protocols for recorded signers.

## 5. Input Signals
Production continuous ISL recognition should consider a multimodal combination of spatial and temporal signals:

- **Hand landmarks:** Precise 21 3D coordinates per hand capturing finger articulation, joint flexion, and palm orientation.
- **Body/pose landmarks:** Upper-body skeletal tracking (shoulders, elbows, wrists, neck, torso) capturing arm trajectories, sign placement relative to the torso, and bodily shifts.
- **Face landmarks or relevant facial features:** Eyebrow movements, head tilt, mouthing, and gaze orientation that convey grammatical markers, interrogative inflection, and emotional tone in ISL.
- **Temporal information across frames:** Sequential frame delta coordinates, velocities, and acceleration vectors over time.

*Architectural Note:* Hand landmarks alone may be insufficient for accurate continuous ISL recognition because body movement and non-manual features (facial expressions, head position, torso posture) fundamentally contribute to meaning, syntax, and grammatical boundaries in natural discourse. (This represents a planned input specification; current client-side implementation captures hand landmarks only).

## 6. Feature Representation
To ensure robust model generalization across diverse real-world environments, raw visual landmarks pass through a standardized conceptual feature representation pipeline:

```
Camera
  ↓
Visual Landmark Extraction (MediaPipe / Vision Models)
  ↓
Normalized Spatial Features
  ↓
Temporal Sequence
  ↓
Recognition Model
```

Normalization should reduce sensitivity to:
- **Camera position:** Variations in camera elevation, pitch, and viewing angle.
- **Signer distance:** Variations in user distance from the lens (depth invariance).
- **Scale:** Disparities in physical body proportions, hand sizes, and limb lengths.
- **Translation:** Centering relative to key anatomical reference origins (such as wrist or torso midpoint) so coordinate shifts across the frame do not corrupt sign identity.

## 7. Proposed Model Architectures
The system evaluates four candidate model families for sequence learning:

1. **BiGRU / Recurrent Temporal Baseline:**
   - *Useful for:* Lightweight sequential modeling over landmark coordinate trajectories.
   - *Main advantage:* Minimal parameter count, low computational overhead, and fast execution on resource-constrained client devices.
   - *Main limitation:* Struggles to model long-range temporal dependencies and complex multi-modal spatial cross-interactions over extended sentences.

2. **Temporal Transformer:**
   - *Useful for:* Capturing global temporal dependencies and long-range semantic context across continuous signing sequences via self-attention.
   - *Main advantage:* Superior modeling of long-distance grammatical relationships and flexible multi-head temporal attention.
   - *Main limitation:* Higher memory footprint and quadratic computational complexity with respect to sequence length, requiring careful attention windowing for real-time edge execution.

3. **ST-GCN (Spatial-Temporal Graph Convolutional Network):**
   - *Useful for:* Explicitly modeling the physical skeletal graph topology of hand joints and body limbs alongside temporal evolution.
   - *Main advantage:* Strong inductive bias respecting human anatomical joint connectivity, yielding data-efficient representations.
   - *Main limitation:* High computational complexity when scaling to dense facial landmarks and sensitive to edge-weight tuning across disparate body scales.

4. **Hybrid Graph + Temporal Attention Model:**
   - *Useful for:* Combining graph convolutions for localized spatial joint interactions with temporal attention blocks for sentence-level context.
   - *Main advantage:* Combines anatomical structural fidelity with high-capacity sequence-level translation capabilities.
   - *Main limitation:* Most complex architecture to train, quantize, and optimize for client-side WebAssembly/WebGPU runtimes.

*Implementation Directive:* The first implementation should use a measurable baseline before moving to a more complex architecture.

## 8. Continuous ISL Recognition
SignConnect addresses the fundamental distinction between isolated sign recognition and continuous sign recognition:
- **Isolated Sign Recognition:** Classifies pre-trimmed, segmented video clips containing a single gesture into an individual label (e.g., discrete vocabulary testing).
- **Continuous Sign Recognition:** Interprets continuous, unsegmented streams of natural signing without predefined boundaries between words.

SignConnect's target is continuous recognition of multi-word and multi-sentence signing rather than treating every frame or isolated gesture as an independent command.

*Example:* A continuous signing sequence such as:
> *"what is your name where are you going"*

should be treated as a continuous temporal sequence and decoded into an ordered linguistic representation.

Possible sequence-learning and alignment approaches under evaluation include Connectionist Temporal Classification (CTC) style training and other sequence-to-sequence approaches. No final approach has been selected yet.

## 9. Recognition Pipeline
The planned conceptual recognition pipeline from visual sensor to multilingual output is structured as follows:

```
Camera
  ↓
MediaPipe / Visual Landmark Extraction
  ↓
Multimodal Feature Representation
  ↓
Temporal Window / Sequence
  ↓
Temporal Recognition Model
  ↓
Continuous Sign Units / Gloss Representation
  ↓
Language Translation
  ↓
English / Hindi / Telugu
  ↓
Text + Speech
```

*Status:* Planned architecture only. This represents a target design specification, not an implemented pipeline.

## 10. Signer-Independent Evaluation
Evaluation must strictly avoid leakage between training and testing signers:
- **Signer-independent train/validation/test splits:** Ensuring that all signers in the validation and test sets never appear in the training split (such as Leave-One-Signer-Out / LOSO protocols).
- **Sentence-level evaluation:** Measuring sentence-level comprehension metrics on complete continuous signing samples.
- **Word/sign recognition metrics:** Evaluating Word Error Rate (WER) and sign recognition metrics where appropriate.
- **Sequence-level translation metrics:** Evaluating translation quality (e.g., BLEU, chrF) across full target spoken sentences where appropriate.
- **Testing on unseen signers:** Systematically evaluating performance on individuals with varying skin tones, hand proportions, signing speeds, and regional accents.

*Methodological Warning:* Random frame-level splitting can produce misleading results because frames from the same signer or signing sequence may appear in both training and testing, artificially inflating accuracy without testing real-world generalization.

## 11. Confidence and Unknown Signs
Production sign interpretation requires active safeguards against spurious outputs:
- **Confidence estimation:** Assessing prediction reliability on continuous temporal sequences.
- **Unknown/unrecognized handling:** Differentiating intentional signing from conversational pauses, arm adjustments, or resting gestures.
- **Rejection of low-confidence predictions:** Suppressing textual output when classification probability does not meet operational thresholds.
- **Prevention of fabricated signs/text:** The system should not force every visual sequence into a known sign, avoiding hallucinated words or misleading translations.

## 12. Architecture Status
Recognition architecture is currently a design specification. No recognition model, training pipeline, dataset loader, or inference service has been implemented yet.

## 13. Production Dataset Specification
SignConnect's production recognition dataset specification establishes the technical, linguistic, and operational standards required for training and evaluating robust, continuous Indian Sign Language models.

### 1. Signing Content
The dataset should prioritize:
- Continuous ISL sentences
- Multi-word expressions
- Multi-sentence utterances
- Conversational signing
- Natural signing sequences
- Appropriate pauses and transitions

It should not be limited to isolated alphabet signs or individual static gestures.

### 2. Visual Signals
Where technically and legally feasible, captured samples should record:
- Both hands (articulation, finger shapes, orientation)
- Upper-body / body pose (shoulders, torso posture, head position)
- Facial / non-manual features (expressions, mouth shapes, head tilt, gaze)
- Temporal movement across frames

The data specification directly supports the multimodal recognition architecture documented in Section 5 and Section 9.

### 3. Multiple Signers
The dataset must include multiple independent signers, capturing natural population variation in:
- Signing style and dialectal inflections
- Hand size and limb lengths
- Body proportions and stature
- Signing speed and fluidity
- Physical appearance and skin tones
- Dominant hand (left-handed and right-handed signers)
- Regional / signing variations across India where applicable

*(No arbitrary or artificial signer count is prescribed; the emphasis is representative demographic and physical diversity).*

### 4. Recording Conditions
To ensure robustness beyond controlled laboratory setups, data capture must introduce systematic variation in:
- Indoor and outdoor environments
- Lighting conditions (natural daylight, fluorescent, low light, backlighting)
- Complex, dynamic, and neutral backgrounds
- Camera distance (close-up, mid-torso, wide framing)
- Camera angle (eye-level, slight elevation, lateral tilts)
- Device and sensor camera quality (budget smartphones, standard webcams, HD sensors)
- Signer position relative to the camera frame

### 5. Annotations
Desired annotation layers across dataset records include:
- Sentence-level natural language transcription
- Temporal start and end boundaries where available
- Sign-level / gloss-level annotations where appropriate
- Language translations (English, Hindi, Telugu)
- Signer identifier (pseudonymized)
- Recording and session identifier
- Relevant capture metadata (environment, sensor type, frame rate)
- Full annotation provenance and reviewer verification records

*(Note: Candidate research datasets do not all currently contain every annotation layer; production pipelines must bridge these gaps through systematic annotation).*

### 6. Signer Metadata
Metadata schema must be strictly architected to protect signer privacy:
- Avoid collecting unnecessary personally identifying information (PII).
- Use pseudonymous, decoupled signer IDs rather than legal names or personal identifiers in model-development and training pipelines.
- Restrict metadata collection strictly to attributes necessary for research, generalization benchmarking, fairness analysis, or model development (such as signing hand dominance and regional dialect group).

### 7. Dataset Splitting
Data must be partitioned according to strict signer-independent rules:
- **Signer-independent train split**
- **Signer-independent validation split**
- **Signer-independent test split**

*Partition Invariants:*
- The exact same signer must never appear across both train and test splits when evaluating signer-independent generalization.
- Recordings originating from the same recording session or near-duplicate visual sequences must never leak across splits.

### 8. Data Quality and Validation
Rigorous verification gates must audit every dataset release:
- Multi-pass annotation review and inter-annotator agreement verification.
- Automated duplicate detection and near-identical sequence filtering.
- Corrupted, dropped-frame, or incomplete sample detection.
- Signal quality and landmark tracking fidelity checks.
- Temporal alignment validation between video timestamps and transcribed boundaries.
- Native ISL deaf community expert validation where possible.

*Methodological Principle:* Automated preprocessing must not be treated as a replacement for human and linguistic validation.

### 9. Consent, Privacy and Provenance
Production data acquisition protocols must uphold rigorous ethical and legal standards:
- Informed consent explicitly covering the intended training and commercial use cases.
- Comprehensive documented data provenance for every video and annotation stream.
- Clear, unencumbered permitted-use terms.
- Robust privacy protections and secure storage safeguards.
- Defined participant withdrawal and deletion procedures where applicable.
- Explicit legal documentation of commercial-use rights.

*(Status: SignConnect does not currently possess this production dataset; these criteria define mandatory requirements for future collection and acquisition).*

### 10. Dataset Versioning
Production datasets must adhere to immutable version control:
- Semantic dataset version numbers (e.g., `v1.0.0`, `v1.1.0`).
- Comprehensive changelogs detailing additions, label corrections, and sample retirements.
- Immutable evaluation and benchmark test-set versions to guarantee reproducible historical scoring.
- Annotation revision tracking and audit trails.
- End-to-end provenance records linked to training runs.

### MVP Dataset Requirements
For the Minimum Viable Product (MVP), the data strategy prioritizes high data quality and signer diversity over simply maximizing raw sample count:
- High-quality continuous sentences covering fundamental communication needs.
- Multiple independent signers exhibiting distinct physical characteristics.
- Multimodal visual information (hands, upper body, face).
- Rigorous sentence-level annotations.
- Strict signer-independent evaluation partitions.
- Fully documented licensing, consent, and usage rights.

### Production Dataset Expansion
Future production expansion beyond the initial MVP will progressively incorporate:
- Expanded cohort of diverse signers across multiple age groups and regional communities.
- Broader variety of sentence types, complex grammatical structures, and syntactic variations.
- Natural multi-turn conversational dialogue data.
- Deeper representation of subtle regional signing dialects.
- Challenging and unconstrained environmental conditions (adverse lighting, mobile motion).
- Expanded multilingual translation coverage across additional Indian regional languages.
- Comprehensive, deaf-community expert-reviewed linguistic annotations.

*(Status: These expanded datasets do not currently exist and represent the long-term production roadmap).*

## 14. Dataset Acquisition Strategy

### 14.1 Dataset Categories

| Category | Datasets | Intended Use | Production/Commercial Status |
|---|---|---|---|
| **Isolated ISL Recognition** | INCLUDE | Isolated-sign research, benchmarking, and potentially useful pretraining/feature research | Potentially usable subject to licence, attribution, privacy/ethical, and underlying media-rights verification |
| **Continuous ISL Benchmarking** | ISLTranslate | Continuous-ISL research and benchmarking | Research / non-commercial under currently stated terms; separate permission required for commercial use |
| **Continuous / Sentence ISL** | ISL-CSLTR | Continuous/sentence-level research and potentially useful pretraining/benchmarking | Potentially useful subject to independent rights and commercial-use verification |
| **ISL Translation** | iSign | ISL translation research/benchmarking | Research / non-commercial under currently stated terms; not for commercial training under those terms |

### 14.2 Acquisition Decision Rules
- Do not download or train on a dataset until its current licence and intended-use rights have been reviewed.
- Public accessibility does not equal commercial permission.
- Dataset licence must be distinguished from repository/code licence.
- Underlying video/media rights must be considered separately.
- Signer consent and privacy requirements must be considered.
- Attribution requirements must be preserved.
- Commercial restrictions must be explicitly recorded.
- If rights are unclear, mark the dataset: "Requires rights verification before production use."
- Keep a provenance record for every dataset used.

### 14.3 MVP Data Strategy
- **Phase 1:** Use legally accessible datasets for research, preprocessing experiments, benchmarking, and baseline development where their terms permit those activities.
- **Phase 2:** Evaluate whether any candidate data can legally support the intended commercial product.
- **Phase 3:** Build/acquire properly licensed production data containing continuous ISL, multiple signers, multimodal information, sentence annotations, and expert validation.

*(No phase has already been completed; this represents the staged execution roadmap).*

### 14.4 Research-Only Data Boundary
Research-only or non-commercial datasets must not be incorporated into a commercial SignConnect training pipeline unless separate permission or licensing authorizes that use.

Research results obtained from restricted datasets must be kept legally separate from production training assets unless the rights permit their transfer into production.

### 14.5 Production Dataset Priority
The long-term priority is a properly licensed, consented, signer-diverse continuous-ISL dataset rather than relying indefinitely on public research datasets.

Required characteristics:
- Continuous sentences
- Multiple independent signers
- Multimodal visual information
- Sentence-level annotations
- Signer-independent evaluation
- Documented provenance
- Explicit permitted-use rights
- ISL expert validation

### 14.6 Dataset Audit Record

| Dataset | Version | Source | Licence | Commercial Permission | Media Rights | Consent/Privacy | Attribution | Review Status |
|---|---|---|---|---|---|---|---|---|
| **INCLUDE** | Requires verification | Requires verification | CC BY 4.0 | Potentially usable subject to verification | Requires verification | Requires verification | Requires verification | Requires rights verification before production use |
| **ISLTranslate** | Requires verification | Requires verification | CC-BY-NC | Separate permission required for commercial use | Requires verification | Requires verification | Requires verification | Research / non-commercial under current stated terms |
| **ISL-CSLTR** | Requires verification | Requires verification | CC BY 4.0 | Potentially useful subject to rights verification | Requires independent verification | Requires verification | Requires verification | Requires rights verification before production use |
| **iSign** | Requires verification | Requires verification | CC BY-NC-SA 4.0 | Not for commercial use under current stated terms | Requires verification | Requires verification | Requires verification | Research / non-commercial under current stated terms |

### 14.7 Acquisition Status
Dataset acquisition has NOT started. No dataset has been downloaded into the SignConnect repository at this milestone.

No dataset is currently approved for commercial production training solely on the basis of this architecture document.

## 15. Multilingual Output
Specifies the translation and localization pipeline converting recognized ISL gloss sequences into fluent natural language sentences in English, Hindi, and regional Indian languages (including Telugu). It will outline syntax restructuring and text-to-speech integration pathways.

## 16. Production Data Strategy
Details the runtime logging, telemetry, and opt-in user feedback loops used to identify recognition failures in production. It will specify edge-case capture mechanisms to systematically drive iterative model improvements.

## 17. Privacy
Outlines strict client-side data handling policies, ensuring video streams and raw camera frames never leave the user's local device without explicit consent. It will document landmark-only processing constraints and regulatory privacy safeguards.

## 18. MVP vs Production
Contrasts the initial scope of the minimum viable product (MVP), focusing on a verified core lexicon and fingerspelling vocabulary, against the full-scale continuous production translation engine. It will establish clear graduation criteria between phases.

## 19. Model Development Plan
Provides a phased, step-by-step roadmap spanning data preprocessing, benchmark baseline establishment, offline model training, quantization, and on-device WebAssembly/WebGPU integration. Each phase will have defined verification gates.

## 20. Components Not Yet to Be Built
Explicitly catalogs all components, models, and systems deferred until architecture validation and milestone sign-offs are complete. This guarantees strict boundary enforcement and prevents premature or unvalidated implementation work.

## 21. Dataset Source Audit

| Dataset | Current Source | Dataset Type | Current Stated License/Terms | Scale / Contents | Commercial Status | Audit Status |
|---|---|---|---|---|---|---|
| **INCLUDE** | AI4Bharat INCLUDE dataset / Hugging Face dataset card | Primarily isolated Indian Sign Language recognition | CC BY 4.0 | 3,816 train examples, 425 validation examples, 1,009 test examples. Dataset documentation states videos represent real people and were recorded in Chennai, Tamil Nadu (does not represent all regional variation of ISL). | Requires rights verification before production use. | Research/benchmark candidate; rights verification required. |
| **ISLTranslate** | Official Exploration-Lab ISLTranslate repository and associated ACL publication | Continuous ISL / ISL-English sentence and phrase data | CC-BY-NC according to current official repository statement | 31,222 ISL-English sentence/phrase pairs | Research / non-commercial; separate permission required. | Research candidate; not approved for commercial training. |
| **ISL-CSLTR** | Mendeley Data | Continuous / sentence-level ISL | CC BY 4.0 | 700 fully annotated videos; 18,863 sentence-level frames; 1,036 word-level images; 100 spoken-language sentences; 7 signers | Requires independent rights verification before production use. | Potential research/benchmark candidate; rights verification required. |
| **iSign** | Exploration-Lab iSign dataset on Hugging Face | ISL translation dataset containing video/pose/text resources | CC BY-NC-SA 4.0 (Current access terms explicitly state: "free for research use but NOT for commercial use") | Video, pose, and text resources across ISL translation tasks | Not approved for commercial training under current stated terms. | Research-only candidate. |

### 21.1 Rights Verification Boundary
Dataset metadata or a repository licence does not by itself establish that SignConnect has every necessary right to use underlying videos, perform commercial model training, redistribute derived assets, or deploy a trained model commercially.

Before production use, the project must retain evidence of the applicable licence/permission, provenance, attribution requirements, consent/privacy considerations, and commercial-use rights.

Where rights remain unclear, the dataset must remain marked "Requires rights verification before production use."

### 21.2 Audit Sources
- **INCLUDE:** AI4Bharat INCLUDE dataset (`ai4bharat/include` on Hugging Face / AI4Bharat repository)
- **ISLTranslate:** Official Exploration-Lab ISLTranslate repository (`Exploration-Lab/ISLTranslate` on GitHub) and associated ACL publication
- **ISL-CSLTR:** Mendeley Data (Continuous Sign Language Dataset for Indian Sign Language, Mendeley Data repository)
- **iSign:** Exploration-Lab iSign dataset (`Exploration-Lab/iSign` on Hugging Face)

## 22. Research Baseline Dataset Selection

### 22.1 Candidate Selection Matrix

| Dataset | Continuous ISL | Scale | Annotation Depth | Multimodal Potential | Signer Diversity | License/Use Constraint | Baseline Relevance |
|---|---|---|---|---|---|---|---|
| **INCLUDE** | No (primarily isolated signs) | 3,816 train, 425 val, 1,009 test examples | Isolated sign class labels | Video / visual landmarks | Recorded in Chennai, Tamil Nadu (does not represent all regional ISL variation) | CC BY 4.0 (requires rights verification before production use) | Limited relevance for the continuous-ISL target; primarily useful for isolated-sign baseline, feature extraction, or pretraining research |
| **ISLTranslate** | Yes (continuous ISL) | 31,222 ISL-English sentence/phrase pairs | Sentence/phrase-level ISL-English pairs | Requires verification | Requires verification | CC-BY-NC (research / non-commercial; separate permission required for commercial use) | Directly relevant to continuous ISL research and sequence benchmarking; restricted to non-commercial research under current terms |
| **ISL-CSLTR** | Yes (continuous / sentence-level) | 700 annotated videos; 18,863 sentence-level frames; 1,036 word-level images; 100 spoken-language sentences | Sentence-level frames and word-level annotations | Video frames and images | 7 signers | CC BY 4.0 (requires independent rights and commercial-use verification) | Relevant for continuous sentence-level research baseline, subject to independent rights and privacy verification |
| **iSign** | Yes (ISL translation) | Requires verification | Video, pose, and text resources across ISL translation tasks | Video, pose, and text resources | Requires verification | CC BY-NC-SA 4.0 (free for research use but NOT for commercial use) | Relevant to ISL translation research; restricted to non-commercial research under current terms |

### 22.2 Baseline Selection Criteria
The first research baseline should prioritize:
1. Continuous rather than isolated signing
2. Sentence-level annotations
3. Sufficient temporal information
4. Multiple signers
5. Useful multimodal information
6. Reproducibility
7. Clearly documented licensing
8. Compatibility with signer-independent evaluation

These are selection criteria, not a ranking system.

### 22.3 Research Baseline Decision
At this milestone, no dataset is approved for download or production training. The project will select a research baseline only after confirming the dataset's current access conditions, licence terms, intended research use, and technical suitability.

A research baseline does not automatically become a production dataset. Research findings, preprocessing artifacts, model weights, and derived assets must remain subject to the rights applicable to their source data.

### 22.4 Acquisition Gate
The project enforces a strict sequential gate before any external dataset can be ingested:

```
SOURCE VERIFICATION
  ↓
LICENSE/RIGHTS CHECK
  ↓
TECHNICAL SUITABILITY CHECK
  ↓
RESEARCH BASELINE APPROVAL
  ↓
DATASET ACQUISITION
  ↓
DATA INTEGRITY CHECK
  ↓
PREPROCESSING
```

Dataset acquisition must not occur before the preceding gates are completed.

## 23. Research Baseline Approval

### 23.1 Selected Research Baseline
Based on the documented candidate-selection matrix and audit:

**Selected research baseline:**
ISL-CSLTR

**Reason for research selection:**
- It is documented as continuous/sentence-level ISL data.
- It contains 700 fully annotated videos.
- It contains 18,863 sentence-level frames.
- It contains 1,036 word-level images.
- It contains 100 spoken-language sentences.
- It contains 7 signers.
- It is therefore technically relevant to the continuous sentence-level recognition target.

*(Note: ISL-CSLTR is not characterized as the "best" dataset, has not been assigned a numerical score or ranking, and is not claimed to be commercially approved).*

### 23.2 Research-Use Approval Boundary
ISL-CSLTR is selected as the proposed research baseline for technical experimentation and benchmarking, subject to verification of its current access conditions and applicable rights.

This research-baseline selection does NOT constitute commercial approval, legal clearance, or permission for production deployment.

Before acquisition, the current dataset licence, source provenance, underlying media rights, signer/privacy considerations, attribution requirements, and permitted uses must be reviewed and recorded.

### 23.3 Why Other Candidates Are Not the Initial Baseline
- **INCLUDE:** Primarily isolated-sign data and therefore does not directly match the project's primary continuous-ISL baseline objective.
- **ISLTranslate:** Highly relevant to continuous ISL research, but its currently documented CC-BY-NC terms make it a research/non-commercial resource unless separate permission is obtained.
- **iSign:** Relevant to ISL translation research, but its currently documented CC BY-NC-SA 4.0 terms restrict commercial use.

*(These assessments are neutral technical and licensing evaluations, not a competitive ranking).*

### 23.4 Acquisition Approval Status
- **Technical baseline selection:** PROVISIONALLY APPROVED
- **Dataset download:** NOT YET APPROVED
- **Commercial production training:** NOT APPROVED
- **Rights verification before acquisition:** REQUIRED

### 23.5 Mandatory Pre-Download Checklist
- [ ] Confirm current source page
- [ ] Confirm current licence/terms
- [ ] Confirm intended research use is permitted
- [ ] Review provenance
- [ ] Review underlying media rights
- [ ] Review signer/privacy considerations
- [ ] Record attribution requirements
- [ ] Record access requirements
- [ ] Record dataset version
- [ ] Record source URL
- [ ] Document approval decision

Dataset acquisition must not begin until this checklist has been reviewed and the research-use decision has been recorded.

### 23.6 Production Separation
The research baseline and eventual production dataset are separate assets. Research use of a dataset does not grant commercial rights to its videos, annotations, derived features, model weights, or other assets.

SignConnect's eventual production training data must have documented rights appropriate for the intended commercial use.

## 24. ISL-CSLTR Pre-Download Verification

### 24.1 Source Verification
- **Dataset name:** ISL-CSLTR: Indian Sign Language Dataset for Continuous Sign Language Translation and Recognition
- **Source:** Mendeley Data (Elsevier repository)
- **Dataset identifier:** `kcmpdxky7p` (Direct URL: `https://data.mendeley.com/datasets/kcmpdxky7p/1`)
- **Current version shown by the source:** Version 1 (DOI: `10.17632/kcmpdxky7p.1`)
- **Publication/update information:** Published on 22 January 2021 by contributors Elakkiya R. and Natarajan B.
- **Dataset description:** Continuous Sign Language Dataset for Indian Sign Language, developed to support research in Sign Language Translation and Recognition (SLTR) and facilitate conversion systems between spoken language and sign language.
- **Dataset contents:** 700 fully annotated videos, 18,863 sentence-level frames, and 1,036 word-level images.
- **Number of videos:** 700 fully annotated video files.
- **Sentence-level information:** 18,863 sentence-level frames corresponding to 100 spoken-language sentences.
- **Word-level information:** 1,036 word-level images.
- **Number of signers:** 7 distinct signers.
- **Additional facts explicitly stated by source:** Data files are structured into sentence-level video recordings and frame directories hosted openly on Mendeley Data.

### 24.2 Licence Verification
The official Mendeley Data source explicitly states the licence as:
**CC BY 4.0** (Creative Commons Attribution 4.0 International)

Licence identification is not equivalent to verification of every underlying media, privacy, consent, or commercial-use right.

### 24.3 Research-Use Assessment
**Status:** VERIFIED FOR RESEARCH BASELINE

*Supporting Facts:*
The dataset was published openly on Mendeley Data specifically for academic and technical research in continuous Sign Language Translation and Recognition (SLTR). The authors published the corpus under a CC BY 4.0 license, which permits research, benchmarking, analysis, and adaptation with appropriate attribution. The verified contents (700 continuous sentence videos across 7 signers) align directly with the technical requirements for an initial continuous ISL research baseline.

### 24.4 Commercial Production Status
Commercial production training: NOT APPROVED.

Commercial use requires separate verification of applicable rights, including underlying media rights, signer/privacy considerations, attribution requirements, and any restrictions applicable to derived or deployed models.

### 24.5 Pre-Download Decision
**Decision:** APPROVED FOR RESEARCH DOWNLOAD

*Decision Explanation:*
The current official Mendeley Data source confirms that ISL-CSLTR (Version 1) is openly accessible under a CC BY 4.0 license for research and benchmarking purposes, with clear authorship and dataset specifications matching the technical criteria of Milestone 6B-4. The download approval is strictly restricted to technical evaluation, preprocessing validation, and research baseline benchmarking. Commercial deployment and production training remain strictly unapproved.

### 24.6 Evidence Record

| Field | Verified Information | Evidence Source | Status |
|---|---|---|---|
| **Dataset source** | Mendeley Data (Elsevier repository) | Official Mendeley dataset record (`https://data.mendeley.com/datasets/kcmpdxky7p/1`) | Verified |
| **Version** | Version 1 (Published 22 January 2021; DOI: `10.17632/kcmpdxky7p.1`) | Mendeley Data page header | Verified |
| **Licence** | CC BY 4.0 | Official Mendeley dataset metadata | Verified |
| **Dataset contents** | 700 annotated videos; 18,863 sentence-level frames; 1,036 word-level images; 100 spoken sentences; 7 signers | Official Mendeley dataset description & file lists | Verified |
| **Research-use terms** | Permitted under CC BY 4.0 with required academic attribution | Creative Commons CC BY 4.0 terms | Verified |
| **Commercial-use terms** | Requires independent verification of underlying media rights and commercial applicability | Project governance policy | Requires verification |
| **Provenance** | Created by Elakkiya R. & Natarajan B. for SLTR research | Mendeley publication records | Verified |
| **Privacy/consent information** | Recordings involve 7 physical human signers; signed consent forms not published in public metadata | Mendeley Data repository | Requires verification |
| **Access conditions** | Open public download via Mendeley Data direct storage | Mendeley Data platform | Verified |

### 24.7 Acquisition Boundary
No dataset files have been downloaded at this milestone.

No dataset should be downloaded until the pre-download decision is APPROVED FOR RESEARCH DOWNLOAD.

This approval, if granted, applies only to the documented research baseline purpose and does not authorize commercial production use.


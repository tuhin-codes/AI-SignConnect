# ISL-CSLTR Preprocessing Architecture Design

## 1. Preprocessing Objectives

The primary goal of the SignConnect continuous Indian Sign Language (ISL) preprocessing architecture is to transform raw, heterogeneous multimodal sensory assets (video recordings, sequential JPEG frames, and isolated lexicon reference cards) from the research-baseline ISL-CSLTR corpus into clean, normalized, leak-free, and temporally coherent geometric feature sequences. 

To support future continuous multi-word and multi-sentence ISL recognition models, preprocessing must satisfy the following explicit functional objectives:

1. **Preserve Temporal Dynamics and Velocity:** Preserve the frame-by-frame temporal trajectory, velocity, and signing cadence across continuous sentence sequences without introducing arbitrary time-warping or discarding transitional movements between lexical signs (epenthesis).
2. **Preserve Sentence and Sequence Boundaries:** Ensure every sequence retains deterministic boundaries mapped to its corresponding spoken English prompt and ISL gloss sequence, preventing artificial concatenation or fragmentation of sentence-level units.
3. **Preserve Available Signer and Variant Metadata:** Maintain explicit tracking of the seven recording variant slots (`1` through `7`) to enable stratified splitting and prevent cross-variant leakage, while documenting known limitations in physical identity verification.
4. **Produce Deterministic and Reproducible Features:** Ensure identical runs on the same raw inputs yield bit-for-bit identical geometric feature tensors, tracking all model parameters, coordinate normalizations, and detection thresholds.
5. **Principled Missing Data Handling:** Deterministically represent occlusions, out-of-frame gestures, and low-confidence detections via explicit binary confidence and visibility masks, strictly forbidding synthetic landmark interpolation or zero-coordinate fabrication where anatomy was absent.
6. **Strict Elimination of Data Leakage:** Ensure training, validation, and test splits prevent frame-level, sequence-level, prompt-level, and session-level leakage.
7. **Multi-Modal Visual Signal Completeness:** Capture dual-hand articulation, upper-body posture, and facial/head non-manual grammatical cues necessary for continuous ISL syntax.

---

## 2. Raw Data Boundary and Storage Architecture

### Immutability of Raw Data
The directory `datasets/isl-csltr/` is designated as a **strictly immutable, read-only physical raw data boundary**. No preprocessing script, conversion tool, or landmark extraction pipeline is permitted to write to, alter, rename, delete, or re-encode any raw archive file or metadata spreadsheet within this hierarchy.

### Rationale for Separation
- **Cryptographic Provenance:** The raw dataset is bound to published SHA-256 cryptographic hashes and official Mendeley DOI identifiers. Any in-place modification invalidates scientific auditability.
- **Reproducibility Across Iterations:** As landmark extractors, normalizations, or coordinate systems evolve, downstream feature sets can be regenerated from the unaltered source.
- **Git and Repository Protection:** Raw data binaries are strictly git-ignored; derived features must follow controlled manifest-driven versioning.

### Proposed Derived Directory Hierarchy
All intermediate and processed artifacts must reside in separate, dedicated directories outside the raw folder:

```text
datasets/
├── isl-csltr/                     [STRICTLY IMMUTABLE - Raw Mendeley V1 Archive & Metadata]
│   ├── metadata/
│   ├── Videos_Sentence_Level/
│   ├── Frames_Sentence_Level/
│   └── Frames_Word_Level/
├── processed/                     [DERIVED - Validated and canonicalized frame metadata]
│   └── sequence_manifests/        (JSON manifests listing valid sequences and file pointers)
├── features/                      [DERIVED - Geometric landmark feature tensors]
│   ├── holistics_v1/              (Extracted raw landmark coordinates per sequence)
│   └── normalized_v1/             (Body-normalized, scale-invariant feature tensors)
├── splits/                        [DERIVED - Deterministic data partitions]
│   └── split_v1_variant_grouped/  (Train, validation, and test sequence ID index lists)
└── manifests/                     [DERIVED - Run audit logs and quality control reports]
    └── preprocessing_v1_audit/    (Quality statistics, missingness logs, and run telemetry)
```

*(Note: These directories are architectural specifications and are NOT created in this design milestone).*

---

## 3. Input Representation Selection

The ISL-CSLTR corpus presents three physical input modalities:

| Modality Candidate | Scope & Composition | Advantages | Disadvantages | Selection Status |
| :--- | :--- | :--- | :--- | :--- |
| **A. Sentence-Level Extracted Frames** (`Frames_Sentence_Level`) | 18,863 sequential JPEG images across 663 sequences and 97 sentences. | • Verified 1-to-1 correspondence in `frame_details.xlsx`<br>• Exact frame-by-frame indexing (`01.jpg`..`N.jpg`)<br>• No video decoder drift or codec timestamp jitter | • 4 sentences omitted from extraction spreadsheet<br>• Disk I/O overhead on large batch reads | **PRIMARY INPUT** |
| **B. Sentence-Level Videos** (`Videos_Sentence_Level`) | 687 physical MP4 videos in archive (492 indexed in `details.xlsx`). | • Contains full 100 sentences<br>• Native temporal video container | • 195 videos uncataloged in metadata<br>• Inconsistent filename indexing (`free (2).MP4`, `(8).MP4`)<br>• Variable container framerates across recording sessions | **SECONDARY FALLBACK** (For the 4 missing frame sentences only, upon manual review) |
| **C. Word-Level Reference Images** (`Frames_Word_Level`) | 1,036 static images across 114 isolated words. | • Clear isolated vocabulary reference | • Zero temporal sequence (static poses)<br>• No temporal alignment to continuous sentences<br>• Cannot provide continuous co-articulation supervision | **EXCLUDED FROM CONTINUOUS PIPELINE** |

### Decision
**Sentence-level extracted frame sequences (Option A) are designated as the PRIMARY input.** They provide a clean, discretely verified sequential index with zero video codec ambiguity. Word-level images (Option C) are strictly excluded from continuous sequence construction as they carry no continuous co-articulation or sentence-level timing information.

---

## 4. Visual Signals Architecture

Indian Sign Language conveys linguistic meaning through a combination of manual signs (handshapes, orientations, locations, and movements) and non-manual markers (facial expressions, eye gaze, head tilts, and torso shifts). The feature extraction architecture specifies three visual signal groups:

```text
                                  VISUAL SIGNALS ARCHITECTURE
                                               │
             ┌─────────────────────────────────┼────────────────────────────────┐
             │                                 │                                │
             ▼                                 ▼                                ▼
       DUAL-HAND SIGNALS               UPPER-BODY POSE                  FACE & NON-MANUAL
  ┌─────────────────────────┐     ┌─────────────────────────┐     ┌───────────────────────────┐
  │ • Left Hand (21 ldmks)  │     │ • Shoulders (Left/Right)│     │ • Head Pose / Tilt        │
  │ • Right Hand (21 ldmks) │     │ • Elbows (Left/Right)   │     │ • Eyebrows (Grammatical)  │
  │ • 3D (X, Y, Z) per pt   │     │ • Wrists (Anchor links) │     │ • Eye Aperture & Gaze     │
  │ • Confidence & Presence │     │ • Sternum / Spine Ref   │     │ • Mouth Gestures / Shapes │
  │ • Handedness Score      │     │ • Hip Midpoint (Anchor) │     │ • Facial Silhouette (468) │
  └─────────────────────────┘     └─────────────────────────┘     └───────────────────────────┘
```

### 4.1. Dual-Hand Articulation
- **Landmarks:** 21 articulation points per hand (Wrist, CMC, MCP, IP, DIP, and TIP across thumb, index, middle, ring, and pinky).
- **Coordinate Dimensions:** 3D coordinates $(X, Y, Z)$ per landmark.
- **Attributes:** Handedness label (Left vs. Right), hand presence score, and landmark-specific visibility/presence confidence scores.

### 4.2. Upper-Body Pose
- **Landmarks:** Upper-body subset of standard 33-point pose topology:
  - Shoulders (Left: #11, Right: #12) — Essential for torso scale and spatial reference.
  - Elbows (Left: #13, Right: #14) — Articulates forearm angle and arm trajectories.
  - Wrists (Left: #15, Right: #16) — Connects torso frame to hand coordinate space.
  - Hips / Pelvic Anchors (Left: #23, Right: #24) — Establishes torso vertical axis and tilt.
- **Coordinate Dimensions:** 3D coordinates $(X, Y, Z)$ plus visibility confidence.

### 4.3. Face and Non-Manual Signals
In ISL, non-manual markers denote question forms (e.g., furrowed brows in wh-questions, raised brows in polar questions), negation (head shakes), affirmation (head nods), and clausal boundaries.
- **Selected Key Facial Features:**
  - Eyebrows: Inner, middle, and outer brow heights (vertical displacement relative to eye corners).
  - Eyes: Upper and lower eyelid aperture (open/closed/squinted) and gaze direction.
  - Mouth & Lips: Upper/lower lip separation, lip corner retraction, and mouth morphemes.
  - Head Pose: 3-DOF rotation angles (yaw, pitch, roll) computed from facial mesh anchors.

### Implementation Status Separation
- **Currently Implemented in SignConnect Web Camera Client:**
  - Real-time client-side `@mediapipe/camera_utils` + `@mediapipe/hands` running in browser DOM.
  - Hand landmarks only (21 points per hand, 2D coordinates normalized to viewport).
  - No pose, no face mesh, no cross-frame normalization, no sequence buffering.
- **Planned Preprocessing Pipeline (Server-Side / Batch):**
  - Holistic 3D extraction (MediaPipe Holistic / Vision Tasks: Hands + Upper Pose + Face Mesh).
  - Full torso-relative spatial normalization and temporal velocity computation.

---

## 5. Feature Contract v1.0 — Locked (230-D Frame-Level Feature Vector)

To establish an immutable, mathematically verified interface between feature extraction and downstream continuous recognition architectures, the frame-level feature vector is **strictly locked at exactly 230 dimensions ($D_{\text{frame}} = 230\text{ floats}$)**.

Every index from **0 through 229** is deterministically assigned to a single anatomical or geometric measurement.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                        LOCKED FRAME FEATURE TENSOR: D_frame = 230 floats                      │
├─────────────────────┬──────────────────┬─────────────────┬──────────────────┬─────────────────┤
│ Left Hand 3D Coords │ Right Hand Coords│ Upper Pose 3D   │ Face Non-Manual  │ Indicators/Mask │ Velocity Deltas │
│ Indices [0 - 62]    │ Indices [63 - 125│ Indices [126-149│ Indices [150-165│ Indices [166-177│ Indices [178-229│
│ (21 pts × 3 = 63)   │ (21 pts × 3 = 63)│ (8 pts × 3 = 24)│ (16 metrics)     │ (12 indicators) │ (26 pts × 2 = 52│
└─────────────────────┴──────────────────┴─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

### 5.1. Exact Index Allocation Table (Indices 0–229)

| Index Range | Category / Feature Group | Source Component & Identifiers | Measurement Details | Dims |
| :--- | :--- | :--- | :--- | :--- |
| **`[0 - 62]`** | **Left Hand 3D Coordinates** | MediaPipe Hand (Left), Landmarks 0–20 | 21 landmarks $\times$ $(x, y, z)$ coordinates normalized to mid-shoulder origin and inter-shoulder distance $D_{\text{shoulder}}$ | **63** |
| **`[63 - 125]`** | **Right Hand 3D Coordinates** | MediaPipe Hand (Right), Landmarks 0–20 | 21 landmarks $\times$ $(x, y, z)$ coordinates normalized to mid-shoulder origin and inter-shoulder distance $D_{\text{shoulder}}$ | **63** |
| **`[126 - 149]`** | **Upper Pose 3D Coordinates** | MediaPipe Pose, 8 Key Landmarks: Shoulders (#11, #12), Elbows (#13, #14), Wrists (#15, #16), Hips (#23, #24) | 8 landmarks $\times$ $(x, y, z)$ coordinates normalized to mid-shoulder origin and inter-shoulder distance $D_{\text{shoulder}}$ | **24** |
| **`[150 - 153]`** | **Face / Eyebrow Displacement** | MediaPipe Face Mesh / Landmarker | Inner Left Brow, Outer Left Brow, Inner Right Brow, Outer Right Brow vertical displacement relative to eye corners | **4** |
| **`[154 - 157]`** | **Face / Eyelids & Gaze** | MediaPipe Face Mesh / Landmarker | Left eye vertical aperture, Right eye vertical aperture, horizontal gaze ratio, vertical gaze ratio | **4** |
| **`[158 - 162]`** | **Face / Mouth & Lips** | MediaPipe Face Mesh / Landmarker | Lip vertical separation, mouth horizontal width, left lip corner $(y)$, right lip corner $(y)$, jaw vertical drop | **5** |
| **`[163 - 165]`** | **Face / Head Orientation** | MediaPipe Face Mesh Rigid Pose | Head Euler angles: Yaw, Pitch, Roll in radians | **3** |
| **`[166 - 167]`** | **Quality / Left Hand** | MediaPipe Hand (Left) | Left hand tracking confidence $[0, 1]$, Left hand binary presence flag $\{0.0, 1.0\}$ | **2** |
| **`[168 - 169]`** | **Quality / Right Hand** | MediaPipe Hand (Right) | Right hand tracking confidence $[0, 1]$, Right hand binary presence flag $\{0.0, 1.0\}$ | **2** |
| **`[170 - 171]`** | **Quality / Upper Pose** | MediaPipe Pose | Upper pose detection confidence $[0, 1]$, Torso anchor stability flag $\{0.0, 1.0\}$ | **2** |
| **`[172 - 173]`** | **Quality / Face** | MediaPipe Face Mesh | Face tracking confidence $[0, 1]$, Head pose tracking quality score $[0, 1]$ | **2** |
| **`[174 - 175]`** | **Handedness Scores** | MediaPipe Hand Classification | Anatomical Left hand probability $[0, 1]$, Anatomical Right hand probability $[0, 1]$ | **2** |
| **`[176 - 177]`** | **Visibility & Occlusion** | Geometric Analysis | Global upper-body landmark visibility ratio $[0, 1]$, Inter-hand occlusion indicator $\{0.0, 1.0\}$ | **2** |
| **`[178 - 229]`** | **First-Order Velocity Deltas** | 26 Key Articulation Landmarks (Table 5.2) | 26 landmarks $\times$ 2 velocity components $(\Delta x, \Delta y)$ per frame interval | **52** |

$$\text{Total Dimension Check} = 63 + 63 + 24 + 4 + 4 + 5 + 3 + 2 + 2 + 2 + 2 + 2 + 2 + 52 = \mathbf{230\text{ floats (PASS)}}$$

---

### 5.2. Locked Velocity Landmark Set (52 Dimensions, Indices 178–229)

To eliminate all ambiguity, the 26 articulation landmarks providing temporal velocity features are explicitly locked. In sign language kinematics, hand gestures are defined by the motion of the finger tips and knuckle bases (metacarpophalangeal joints) relative to wrist, elbow, and shoulder anchors:

| Velocity Landmark # | Landmark Semantic Name | Source Extractor & ID | Feature Name & Index Allocation |
| :--- | :--- | :--- | :--- |
| **1** | Left Thumb Tip | MediaPipe Hand (Left) #4 | `vel_left_thumb_tip` $\to$ `[178: dx, 179: dy]` |
| **2** | Left Index Tip | MediaPipe Hand (Left) #8 | `vel_left_index_tip` $\to$ `[180: dx, 181: dy]` |
| **3** | Left Middle Tip | MediaPipe Hand (Left) #12 | `vel_left_middle_tip` $\to$ `[182: dx, 183: dy]` |
| **4** | Left Ring Tip | MediaPipe Hand (Left) #16 | `vel_left_ring_tip` $\to$ `[184: dx, 185: dy]` |
| **5** | Left Pinky Tip | MediaPipe Hand (Left) #20 | `vel_left_pinky_tip` $\to$ `[186: dx, 187: dy]` |
| **6** | Right Thumb Tip | MediaPipe Hand (Right) #4 | `vel_right_thumb_tip` $\to$ `[188: dx, 189: dy]` |
| **7** | Right Index Tip | MediaPipe Hand (Right) #8 | `vel_right_index_tip` $\to$ `[190: dx, 191: dy]` |
| **8** | Right Middle Tip | MediaPipe Hand (Right) #12 | `vel_right_middle_tip` $\to$ `[192: dx, 193: dy]` |
| **9** | Right Ring Tip | MediaPipe Hand (Right) #16 | `vel_right_ring_tip` $\to$ `[194: dx, 195: dy]` |
| **10** | Right Pinky Tip | MediaPipe Hand (Right) #20 | `vel_right_pinky_tip` $\to$ `[196: dx, 197: dy]` |
| **11** | Left Thumb MCP | MediaPipe Hand (Left) #2 | `vel_left_thumb_mcp` $\to$ `[198: dx, 199: dy]` |
| **12** | Left Index MCP | MediaPipe Hand (Left) #5 | `vel_left_index_mcp` $\to$ `[200: dx, 201: dy]` |
| **13** | Left Middle MCP | MediaPipe Hand (Left) #9 | `vel_left_middle_mcp` $\to$ `[202: dx, 203: dy]` |
| **14** | Left Ring MCP | MediaPipe Hand (Left) #13 | `vel_left_ring_mcp` $\to$ `[204: dx, 205: dy]` |
| **15** | Left Pinky MCP | MediaPipe Hand (Left) #17 | `vel_left_pinky_mcp` $\to$ `[206: dx, 207: dy]` |
| **16** | Right Thumb MCP | MediaPipe Hand (Right) #2 | `vel_right_thumb_mcp` $\to$ `[208: dx, 209: dy]` |
| **17** | Right Index MCP | MediaPipe Hand (Right) #5 | `vel_right_index_mcp` $\to$ `[210: dx, 211: dy]` |
| **18** | Right Middle MCP | MediaPipe Hand (Right) #9 | `vel_right_middle_mcp` $\to$ `[212: dx, 213: dy]` |
| **19** | Right Ring MCP | MediaPipe Hand (Right) #13 | `vel_right_ring_mcp` $\to$ `[214: dx, 215: dy]` |
| **20** | Right Pinky MCP | MediaPipe Hand (Right) #17 | `vel_right_pinky_mcp` $\to$ `[216: dx, 217: dy]` |
| **21** | Left Wrist | MediaPipe Hand #0 / Pose #15 | `vel_left_wrist` $\to$ `[218: dx, 219: dy]` |
| **22** | Right Wrist | MediaPipe Hand #0 / Pose #16 | `vel_right_wrist` $\to$ `[220: dx, 221: dy]` |
| **23** | Left Elbow | MediaPipe Pose #13 | `vel_left_elbow` $\to$ `[222: dx, 223: dy]` |
| **24** | Right Elbow | MediaPipe Pose #14 | `vel_right_elbow` $\to$ `[224: dx, 225: dy]` |
| **25** | Left Shoulder | MediaPipe Pose #11 | `vel_left_shoulder` $\to$ `[226: dx, 227: dy]` |
| **26** | Right Shoulder | MediaPipe Pose #12 | `vel_right_shoulder` $\to$ `[228: dx, 229: dy]` |

$$\text{Velocity Dimension Check} = 26 \text{ landmarks} \times 2 \text{ components } (\Delta x, \Delta y) = \mathbf{52\text{ dimensions (PASS)}}$$

---

### 5.3. Velocity Semantics & Timestamp Limitation

- **Mathematical Formulation:**  
  $$\Delta x_i(t) = x_i(t) - x_i(t-1), \quad \Delta y_i(t) = y_i(t) - y_i(t-1)$$
  where $x_i(t), y_i(t)$ are the torso-normalized 2D coordinates of landmark $i$ at discrete frame index $t$.
- **First-Frame Invariant ($t=0$):**  
  For the initial frame of any sequence, no prior state exists. Velocity components are deterministically set to zero:
  $$\Delta x_i(0) = 0.0, \quad \Delta y_i(0) = 0.0 \quad \forall i \in \{1, \dots, 26\}$$
- **Missing Landmark / Occlusion Behavior:**  
  If landmark $i$ was untracked or below presence threshold ($\tau < 0.5$) at frame $t$ OR frame $t-1$, the velocity delta cannot be reliably measured. In this case:
  $$\Delta x_i(t) = 0.0, \quad \Delta y_i(t) = 0.0$$
  and the corresponding presence/confidence indicators for that landmark are marked $0.0$.
- **Frame-Gap Behavior (The 3 Known Dataset Sequences):**  
  In sequences with missing frame indices (`how are things/3`, `i am really grateful/4`, `i really appreciate it/2`), velocity across the missing step must NOT be inflated. The transition across the gap is set to $\Delta = (0.0, 0.0)$ and tagged with quality flag `QC_GAP_STEP`.
- **CRITICAL DATASET TIMESTAMP LIMITATION:**  
  As established in Milestone 6B-7C, the ISL-CSLTR dataset provides **sequential frame ordering only, with no verified physical millisecond timestamps**. Therefore:
  - Velocities represent **normalized coordinate displacement per discrete frame step**.
  - Velocities must **NEVER be scaled to physical velocity units** (such as meters/second or pixels/second) because framerate constancy across sessions is not empirically verified.

---

### 5.4. Anatomical Hand Left/Right Semantics

- **The Problem:** In video frames, screen-left corresponds to anatomical-right from the signer's egocentric perspective. Furthermore, signers frequently cross hands during continuous signing (e.g., right hand operating in the left signing space).
- **Binding Rule:** The preprocessing pipeline **MUST NOT use 2D screen coordinate positioning** to allocate indices `[0-62]` (Left Hand) and `[63-125]` (Right Hand).
- **Mandated Assignment:** Hand channels must be assigned strictly using **MediaPipe's internal 3D Handedness classification** (which evaluates palm normal vectors, thumb direction, and dorsum orientation relative to wrist). If handedness classification confidence drops below $\tau_{\text{handedness}} = 0.6$, the hand is tagged with quality flag `QC_AMBIGUOUS_HANDEDNESS`.

---

### 5.5. Resolution of Future Signal Dependency Count

The previous informal note stating that "104 dimensions depend on future signals" contained an arithmetic discrepancy (it mistakenly referenced 60 velocity floats). 

With the 230-D feature contract now locked, the exact dependency breakdown on future extractors (Pose Landmarker and Face Mesh) is mathematically verified:

1. **Upper-Body Pose Coordinates:** 8 landmarks $\times$ 3 coords = **24 dimensions** (Indices 126–149)
2. **Face / Non-Manual Indicators:** 16 geometric metrics = **16 dimensions** (Indices 150–165)
3. **Pose & Face Quality Indicators:** Upper pose confidence (2) + Face confidence (2) = **4 dimensions** (Indices 170–173)
4. **Pose-Derived Velocity Deltas:** 
   - 6 pose landmarks (Left/Right Shoulders [2], Elbows [2], Wrists [2]) $\times$ 2 velocity deltas = **12 dimensions** (Indices 218–229)
   *(Note: Wrists are dual-represented in Hand and Pose models; if wrist velocities are derived from Hand landmarks, pure pose velocities equal 8 dimensions).*

**Exact Future Extractor Dependency:** Exactly **56 dimensions** (or 52 if wrists are assigned to the Hand extractor) depend on Pose and Face models that are not yet implemented in the client-side prototype. The remaining **174 to 178 dimensions** originate from hand landmarks, hand quality indicators, and hand velocities.

---

### 5.6. Implementation Authorization Boundary

> [!IMPORTANT]
> **Preprocessing implementation is NOT authorized by this milestone.**
> This document locks the architectural and geometric contract only. No code modification, landmark extraction, tensor generation, or pipeline execution may occur without explicit milestone authorization.

---

## 6. Spatial Normalization Architecture

Raw image coordinates vary widely due to signer distance, body morphology, seating height, and camera placement. Preprocessing must normalize scale and position without destroying phonologically meaningful signing space.

```text
                               SPATIAL NORMALIZATION FLOW
                                           │
  Raw Landmark (X_raw, Y_raw, Z_raw)       │
                     │                     ▼
                     ├────────► STEP 1: TRANSLATION NORMALIZATION
                     │          • Compute Mid-Shoulder Anchor: C_origin = (P_L_shoulder + P_R_shoulder) / 2
                     │          • Shift all points: P_trans = P_raw - C_origin
                     │
                     ├────────► STEP 2: SCALE NORMALIZATION
                     │          • Compute Inter-Shoulder Euclidean Distance: D_shoulder = ||P_L_shoulder - P_R_shoulder||
                     │          • Scale coordinates: P_norm = P_trans / D_shoulder
                     │
                     └────────► STEP 3: DEPTH SCALING
                                • Compute Z relative to mid-shoulder coronal plane
                                • Normalize Z_norm = Z_trans / D_shoulder
```

### Critical Preservation of Signing Space
- **Preserve Signing Space Geometry:** In ISL, whether a sign is made at the forehead, chest, chin, or neutral space in front of the abdomen is phonemic. **Normalizing hand coordinates relative to the hand's own centroid is strictly forbidden**, as doing so would destroy all spatial location information. Hands must always be expressed in the **torso-anchored coordinate system**.
- **Preserve Aspect Ratio:** Coordinate axes must be scaled by the uniform scalar $D_{\text{shoulder}}$. Independent scaling along $X$ and $Y$ ($X / W, Y / H$) is forbidden as it distorts handshape aspect ratios when the body moves.

---

## 7. Temporal Representation & Sequence Construction

### Empirical Dataset Temporal Facts
- Total continuous sequences in corpus: **663 sequences**.
- Sequence length distribution: Minimum = **6 frames**, Maximum = **147 frames**, Mean = **28.45 frames**, Median $\approx$ 26 frames.
- 95% of sequences contain fewer than 60 frames.

### Variable-Length Sequence Design
SignConnect adopts a **variable-length sequence paradigm with dynamic masking**:

```text
TENSOR LAYOUT: [Batch_Size, Max_Batch_Length, 230]
MASK LAYOUT:   [Batch_Size, Max_Batch_Length] (Boolean True for valid frames, False for pad)
```

1. **No Fixed Truncation:** Truncating sequences to an arbitrary length (e.g., 30 frames) would discard over 40% of complex multi-word sentence gestures. All valid frames up to sequence termination are preserved.
2. **Dynamic Mini-Batch Padding:** Sequences are padded with zeros only up to the maximum sequence length *within each training batch* ($T_{\text{max\_batch}}$), minimizing redundant compute.
3. **Temporal Attention Masking:** Recurrent, Transformer, and CTC architectures must consume the companion binary attention mask ($M \in \{0, 1\}^{B \times T}$) so padded timesteps contribute zero loss and zero attention weight.
4. **Preservation of Natural Speed:** No artificial frame interpolation or decimation is applied during baseline preprocessing. Pauses, holds, and phrase-final lengthening are linguistically salient features of ISL discourse and must remain unaltered.

---

## 8. Missing and Low-Confidence Landmark Strategy

Occlusions (e.g., one hand occluding the other, hands moving behind the torso, or hands exiting camera view) are frequent in natural signing.

### Principles:
1. **Never Fabricate Anatomical Coordinates:** Filling missing hand landmarks with $(0, 0, 0)$ or arbitrary centroids corrupts spatial derivatives and falsely suggests the hand is resting at the mid-shoulder anchor.
2. **Explicit Presence / Mask Encoding:**
   - When a hand is not detected (presence score $< \tau_{\text{presence}} = 0.5$):
     - Coordinates $(x, y, z)$ are set to `NaN` during internal processing, and replaced with `0.0` only in the final padded tensor.
     - The corresponding **Hand Confidence & Presence Indicators** in the feature vector are explicitly set to `0.0` (present = `1.0`, absent = `0.0`).
3. **Pose / Torso Dropout Recovery:**
   - Shoulders are stable across nearly all frames. If a single shoulder detection drops below confidence threshold $\tau_{\text{pose}} = 0.5$ for $\le 2$ consecutive frames, linear interpolation from adjacent valid frames is permitted.
   - If pose landmarks are missing for $> 3$ consecutive frames, the entire sequence is marked with `QUALITY_FLAG_UNSTABLE_POSE`.

---

## 9. Frame Quality Control Pipeline

Quality control must execute deterministically prior to feature aggregation. All anomalies are recorded in derived JSON manifests; **raw data files are never altered**.

```text
                              FRAME-LEVEL QUALITY PIPELINE
                                           │
                                           ▼
                                [1. FILE INTEGRITY CHECK]
                                 • Verify file readability
                                 • Check header corruption
                                 • Check pixel dimensions
                                           │
                                           ▼
                                [2. SEQUENCE CONTINUITY]
                                 • Check sequential numbering (1..N)
                                 • Flag missing index gaps
                                   (e.g., 3 known dataset gaps)
                                           │
                                           ▼
                                [3. ANATOMICAL DETECTION]
                                 • Validate torso presence
                                 • Compute hand detection ratio:
                                   R_hand = (N_detected_frames / N_total)
                                           │
                                           ▼
                                [4. QUALITY FLAGGING]
                                 • ASSIGN QUALITY FLAGS:
                                   - QC_PASS (Clean sequence)
                                   - QC_GAP_INTERPOLATED (Frame index gap)
                                   - QC_LOW_DETECTION (Hands missing > 50%)
                                   - QC_CORRUPTED (Unreadable image)
```

---

## 10. Signer and Session Leakage Prevention

### The Leakage Threat in Continuous Sign Recognition
If frames or sequences from the same recording session or signer appear in both training and test sets, models memorize idiosyncratic clothing, skin reflectance, background artifacts, and signer-specific dialectal mannerisms rather than generalizable ISL phonology.

### Verified Limitation of the ISL-CSLTR Dataset
- As proven in Audit Milestone 6B-7C, the seven variant subdirectories (`1` through `7`) represent recording slots, but **the metadata does not contain a verified signer mapping table proving that folder `1` represents the same individual across all sentences**.
- In video recordings, index numbers are inconsistent (e.g., `(8).MP4`).

### Mandatory Preprocessing Safeguards:
1. **Sentence-Level Stratified Grouping:** Train, validation, and test splits must strictly partition entire **sentence concepts** or entire **variant slot groups**.
2. **Never Split Across Frames:** Under no circumstances may frames from the same sequence be partitioned into train and test sets.
3. **Conservative Variant-Grouped Partitioning:**
   - Variant slots `1`, `2`, `3`, `4`, `5` are provisionally assigned to Training.
   - Variant slot `6` is assigned to Validation.
   - Variant slot `7` is assigned to Test.
   - *Limitation Caveat:* This grouping is documented as provisional pending formal signer identity verification.
4. **Audit Requirement:** The derived dataset split manifest must record the hash of all assigned sequence IDs.

---

## 11. Label Representation Architecture

Spoken English syntax differs fundamentally from Indian Sign Language grammar. Preprocessing must maintain strict separation between spoken language text and sign gloss sequences.

```text
                               LABEL SEPARATION ARCHITECTURE
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
                      ▼                                               ▼
             NATURAL ENGLISH TEXT                            ISL GLOSS SEQUENCE
         ┌───────────────────────────┐                   ┌───────────────────────────┐
         │ "are you free today"      │                   │ ["YOU", "FREE", "TODAY"]  │
         ├───────────────────────────┤                   ├───────────────────────────┤
         │ • Spoken language syntax  │                   │ • ISL grammatical order   │
         │ • Case & punctuation      │                   │ • Normalized token list   │
         │ • Used for translation /  │                   │ • CTC / sequence targets  │
         │   text generation models  │                   │ • Vocabulary: 170 tokens  │
         └───────────────────────────┘                   └───────────────────────────┘
```

### Label Fields per Sequence Manifest:
1. `sentence_id`: Canonical normalized string (e.g., `"are_you_free_today"`).
2. `spoken_english_text`: Cleaned English prompt (e.g., `"are you free today"`).
3. `isl_gloss_sequence`: Array of normalized uppercase tokens (e.g., `["YOU", "FREE", "TODAY"]`).
4. `isl_gloss_indices`: Integer token IDs mapped to the formal SignConnect ISL gloss vocabulary dictionary.
5. `variant_slot`: Numerical slot string (`"1"`..`"7"`).
6. `total_frames`: Integer frame count $N$.
7. `quality_status`: String flag (`"QC_PASS"`, `"QC_REVIEW"`).

---

## 12. Dataset Splitting Strategy

The conceptual splitting strategy balances linguistic coverage and variant separation across the 663 continuous sequences:

| Split Partition | Targeted Percentage | Allocation Rule | Primary Evaluation Purpose |
| :--- | :--- | :--- | :--- |
| **Train Set** | ~70% (464 sequences) | Variant slots `1`, `2`, `3`, `4`, `5` across all available sentences. | Model parameter optimization and representation learning. |
| **Validation Set** | ~15% (99 sequences) | Variant slot `6` across all available sentences. | Hyperparameter tuning, early stopping, and convergence monitoring. |
| **Test Set** | ~15% (100 sequences) | Variant slot `7` across all available sentences. | Benchmark evaluation on unseen variant sequences. |

### Strict Split Invariant
All split assignments are written to immutable manifest files (`datasets/splits/split_v1_manifest.json`). Once generated, test sets are frozen.

---

## 13. Data Augmentation Policy

In sign language recognition, naive spatial transformations can invert handshape morphology or alter spatial semantics.

```text
┌──────────────────────────────────────┬─────────────────────────────────────────────────────────┐
│ Augmentation Category                │ Preprocessing Policy & Rationale                        │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ **Horizontal Flipping (Mirroring)**  │ ❌ STRICTLY FORBIDDEN. Handedness is phonemically       │
│                                      │ meaningful in ISL. Flipping inverts dominant and        │
│                                      │ non-dominant roles and corrupts directional verbs.      │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ **Aggressive Plane Rotation (> 15°)**│ ❌ STRICTLY FORBIDDEN. Hand orientation (up, down,      │
│                                      │ towards signer) is a core phonological parameter.      │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ **Mild 2D Translation (±5% torso)** │ ✅ SAFE / PERMITTED. Simulates minor standing position │
│                                      │ shifts without altering internal joint angles.          │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ **Mild Scale Jitter (±8%)**          │ ✅ SAFE / PERMITTED. Simulates minor camera distance   │
│                                      │ variations. Hand-to-torso proportions are preserved.   │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ **Temporal Resampling (±10% speed)** │ ✅ SAFE / PERMITTED. Simulates natural variations in    │
│                                      │ signing speed via linear frame interpolation.           │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ **Gaussian Landmark Jitter**         │ ⚠️ CONDITIONAL. Very mild noise (σ = 0.002) can prevent │
│                                      │ sensor overfitting, but must not distort finger joints. │
└──────────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 14. Data Versioning Scheme

To guarantee scientific traceability from any future trained model checkpoint back to the raw source data, a four-tier semantic versioning convention is established:

```text
[RAW_DATA_VERSION]   --> datasets/isl-csltr@mendeley-v1.0 (SHA: 1a849c89c1...)
        │
        ▼
[PREPROCESS_VERSION] --> prep-v1.0.0 (Code hash: git-commit-xyz)
        │
        ▼
[FEATURE_VERSION]    --> feat-holistics-d230-v1.0
        │
        ▼
[SPLIT_VERSION]      --> split-variant-stratified-v1.0
```

Every derived feature tensor file must embed these four version strings in its metadata header.

---

## 15. Reproducibility & Audit Trail Contract

Any future execution of the preprocessing pipeline must write an immutable audit log to `datasets/manifests/preprocessing_<date>_<version>.json` containing:

1. **Source Code State:** Git commit SHA and status of the preprocessing repository.
2. **Extractor Configuration:** MediaPipe Holistic / Vision Tasks build number, model complexity setting, and minimum detection/tracking confidence parameters.
3. **Random Number Seeds:** Explicit RNG seeds for any stochastic sampling or augmentation.
4. **Execution Telemetry:** Exact timestamps, compute environment details, OS version, and Python/C++ library versions.
5. **Quality Statistics:**
   - Total sequences processed, passed, flagged, and failed.
   - Per-joint landmark detection rates across left hand, right hand, face, and pose.
   - Average sequence durations and padding statistics.

---

## 16. Privacy, Ethics & Data Governance

1. **Research-Only Boundary:** The dataset is acquired strictly under the non-commercial research baseline authorization of the SignConnect project. **Commercial production training remains NOT APPROVED.**
2. **Git Commit Prohibition:** Raw videos, frame images, and derived landmark tensors must NEVER be committed to the public or private GitHub repository.
3. **Facial Privacy:** MediaPipe extraction reduces photographic portraits to geometric landmark meshes, providing an inherent de-identification layer. However, geometric facial landmarks can still encode biometric features and must be guarded with standard research privacy controls.
4. **Attribution Requirement:** Any derivative benchmarks or publications must explicitly cite the original creators (Navajeevan Residential School for the Deaf, SASTRA Deemed University, and SERB Grant SRG/2019/001338).

---

## 17. Compute Strategy & Pipeline Execution

The preprocessing architecture is structured into decoupled, stateless stages enabling both local developer execution and distributed batch processing:

```text
[Raw Frame Sequence]
         │
         ▼ (Stage 1: Multi-threaded Image Decoding & Integrity Check)
[Decoded RGB Array]
         │
         ▼ (Stage 2: Batched Landmark Inference - CPU / GPU Worker)
[Raw Landmark JSON]
         │
         ▼ (Stage 3: Vectorized Spatial Normalization & Feature Assembly)
[Clean Numpy Tensor: (T, 230)]
         │
         ▼ (Stage 4: Quality Validation & Serialization)
[Compressed NPZ / HDF5 Feature Archive]
```

- **Execution Environment:** Designed to run via CPU multiprocessing (e.g., Python `concurrent.futures` / `multiprocessing`) or single GPU batch inference.
- **Resource Footprint:** Frame sequences average 28.45 frames; memory footprint per raw sequence is $< 50\text{ MB}$, and $< 200\text{ KB}$ per extracted feature tensor.

---

## 18. Deterministic Failure Handling Policy

When unreadable assets or detection failures occur during pipeline execution, processing must follow this deterministic decision matrix:

| Failure Mode | Impacted Scope | Deterministic Action | Classification |
| :--- | :--- | :--- | :--- |
| **Unreadable / Corrupted JPEG** | Single frame | Flag sequence; check if adjacent frames exist. If isolated frame ($<2\%$), interpolate landmarks from $t-1$ and $t+1$. | `KEEP WITH INTERPOLATION` |
| **Multiple Corrupted Frames** | $> 3$ consecutive frames | Exclude entire sequence from training; record error in manifest. | `EXCLUDE FROM TRAINING` |
| **Missing Hand Detection** | Hand out-of-frame / resting | Set coordinates to 0.0, set presence indicator to 0.0. Do NOT drop frame. | `KEEP WITH MASK` |
| **Missing Pose Detection** | Torso untracked | If $> 3$ frames missing, exclude sequence (cannot compute torso anchor). | `EXCLUDE FROM TRAINING` |
| **Missing Frame Index Gap** | Known 3 dataset gaps | Advance frame counter; interpolate time delta; log sequence ID. | `KEEP WITH MASK` |
| **Corrupted Metadata Entry** | Row 493 (`>>>\xa0`) | Drop invalid row during manifest parsing; log drop. | `EXCLUDE ENTRY` |

---

## 19. Preprocessing Output Contract

For each processed continuous sequence, the pipeline must produce a structured record conforming to the following formal JSON / NPZ schema:

```json
{
  "sequence_id": "are_you_free_today_var1",
  "dataset_version": "mendeley-v1.0",
  "preprocessing_version": "prep-v1.0.0",
  "source_sentence_text": "are you free today",
  "isl_gloss_sequence": ["YOU", "FREE", "TODAY"],
  "variant_slot": "1",
  "frame_count": 22,
  "feature_tensor_shape": [22, 230],
  "feature_tensor_file": "features/normalized_v1/are_you_free_today_var1.npy",
  "quality_control": {
    "status": "QC_PASS",
    "left_hand_detection_ratio": 0.0,
    "right_hand_detection_ratio": 0.954,
    "pose_detection_ratio": 1.0,
    "face_detection_ratio": 1.0,
    "numbering_gaps_detected": 0
  }
}
```

---

## 20. Current vs. Planned Preprocessing State

| Dimension | Current Implementation in SignConnect | Future Preprocessing Architecture |
| :--- | :--- | :--- |
| **Hand Landmark Extraction** | Browser client-side MediaPipe Hands (21 points, 2D viewport coords) | Batch Holistic extraction (21 points per hand, 3D world coords) |
| **Upper-Body Pose** | Not implemented (Hands only) | 8 upper-body torso & arm anchor points (3D world coords) |
| **Face & Non-Manual Cues** | Not implemented | 16 extracted linguistic geometric facial indicators |
| **Spatial Normalization** | Viewport aspect-ratio scaling only | Torso-anchored, inter-shoulder scale normalization |
| **Temporal Sequence Handling** | Single frame inference via Canvas RAF loop | Variable-length sequence buffering with dynamic temporal masking |
| **Quality Control** | Client-side visual fallback text | Automated file integrity, continuity, and landmark confidence filtering |
| **Signer-Independent Splitting** | Not applicable (live demo) | Variant-stratified train/validation/test splits |
| **Gloss Label Mapping** | Hardcoded static UI string matching | Tokenized, normalized vocabulary dictionary (170 gloss classes) |
| **Feature Serialization** | Ephemeral browser memory | Immutable compressed tensors (`.npy` / `.npz`) with versioned metadata |
| **Continuous Model Training Ready**| No (prototype interface only) | Yes (structured tensors ready for sequence model consumption) |

---

## 21. Preprocessing Implementation Gate

Prior to executing any code that reads raw frames, invokes landmark extractors, writes feature tensors, or alters workspace states, all of the following milestone gate conditions must be explicitly verified:

1. [x] **Formal Dataset Audit Completed:** All discrepancies, file counts, and entity relationships documented (`docs/ISL_CSLRT_DATASET_SCHEMA_AUDIT.md`).
2. [x] **Preprocessing Architecture Approved:** This design specification (`docs/ISL_CSLRT_PREPROCESSING_ARCHITECTURE.md`) is reviewed and committed.
3. [ ] **Raw Dataset Immutability Verified:** Confirmation that raw datasets remain untouched and git-ignored.
4. [ ] **Landmark Feature Extraction Plan Approved:** Formal confirmation of the $D=230$ feature vector representation and extractor model version.
5. [ ] **Missing Data & Normalization Logic Formally Signed Off:** Agreement on torso-relative anchor coordinates and absence masking.
6. [ ] **Storage Hierarchy Provisioned:** Separate `datasets/features/` and `datasets/splits/` partitions created outside the raw tree.
7. [ ] **No Commercial Rights Breached:** Explicit confirmation that processing operates strictly within research baseline limits.

---

### FINAL ARCHITECTURAL STATUS
- **PREPROCESSING ARCHITECTURE:** DESIGN ONLY (COMPLETED)
- **RAW DATA MODIFIED:** NO
- **APPLICATION MODIFIED:** NO
- **FEATURE EXTRACTION:** NOT STARTED
- **TRAINING:** NOT STARTED

# ISL-CSLTR Dataset Schema & Annotation Audit

## 1. Audit Scope

This document presents a technical, schema, and relational consistency audit of the Indian Sign Language Continuous Sign Language Recognition and Translation (**ISL-CSLTR**) dataset acquired for technical research baseline evaluation within the SignConnect initiative.

- **Dataset Identification:** Mendeley Data ID `kcmpdxky7p`, Version 1
- **Digital Object Identifier (DOI):** `10.17632/kcmpdxky7p.1`
- **Audit Methodology:** Strictly read-only computational inspection of the official container archive directory structure and the five official annotation and metadata files in `datasets/isl-csltr/metadata/`.
- **Governing Objective:** To rigorously verify the entity relationships connecting spoken English sentences, video recordings, signer/variant identifiers, frame sequences, isolated words, and sign glosses prior to any downstream experimental preprocessing or architectural design.

---

## 2. Dataset Inventory

To establish data provenance, table counts are categorized into three verified operational tiers: documented dataset totals, metadata-indexed totals, and physically observed archive totals.

| Dimension / Asset Class | Documented Dataset Total (`ISL_CSLRT.txt`) | Metadata-Indexed Total (Spreadsheets / CSV) | Physically Observed Archive Total (Master Archive) |
| :--- | :--- | :--- | :--- |
| **Spoken Sentences** | 100 sentences | 101 in gloss CSV; 101 in `details.xlsx`; 97 in `frame_details.xlsx` | 100 sentence subdirectories in `Videos_Sentence_Level/` and `Frames_Sentence_Level/` |
| **Continuous Sign Videos** | 700 videos | 492 valid paths in `details.xlsx` (1 trailing anomaly cell) | 687 MP4 video files in `Videos_Sentence_Level/` |
| **Sentence Frame Sequences** | 18,863 frames | 18,863 frame paths across 663 sequences in `frame_details.xlsx` | 18,863 JPG frame images in `Frames_Sentence_Level/` (20,110 zip items including directories) |
| **Isolated Word Images** | 1,036 word images | 1,036 image paths across 114 words in `word_details.xlsx` | 1,036 JPG image files in `Frames_Word_Level/` (1,168 zip items including directories) |
| **Isolated Word Vocabulary** | Unstated | 114 unique word concepts | 114 subdirectories under `Frames_Word_Level/` |
| **Signer / Variant Slots** | 7 signers (2 native, 5 student volunteers) | 7 numerical folder identifiers (`1` through `7`) in frame paths | 7 folder branches per sentence where fully populated |
| **Sign Gloss Mappings** | Unstated | 101 sentence-gloss pairs (100 unique sequences) | 1 official CSV mapping document |
| **Total Archive Entries** | Unstated | 20,496 combined metadata rows | 22,073 zip entries (8,905,822,924 bytes compressed) |

---

## 3. Annotation File Audit

### 3.1. `ISL Corpus sign glosses.csv`
- **Purpose:** Canonical linguistic mapping from natural spoken English sentences to Indian Sign Language (ISL) uppercase sign gloss token sequences.
- **File Structure:** Plain UTF-8 comma-separated text (3,872 bytes).
- **Columns:** `Sentence`, `SIGN GLOSSES`
- **Record Counts:** 1 header row + 101 data rows (102 rows total).
- **Relevant Identifiers:** Natural English sentence string in `Sentence`.
- **Available Linguistic Information:** High-level tokenized sign gloss sequence in `SIGN GLOSSES` (e.g., `"YOU FREE TODAY"`).
- **Available Temporal Information:** **None** (no frame ranges, timecodes, or token-level segmentations).

### 3.2. `ISL_CSLRT_Corpus details.xlsx`
- **Purpose:** Video catalog indexing continuous sentence-level MP4 video files to sentence prompts.
- **File Structure:** Microsoft Excel OpenXML Workbook (23,034 bytes) containing three worksheets (`Sheet1` populated; `Sheet2` and `Sheet3` empty).
- **Columns:** `Sentences`, `File location`
- **Record Counts:** 1 header row + 493 data rows (494 XML rows total in `Sheet1`).
  - *Data Quality Note:* Row 493 contains an unlinked trailing anomaly string `['>>>\xa0']`. Net valid indexed video paths = **492**.
- **Relevant Identifiers:** Sentence prompt string in `Sentences`; relative video path in `File location`.
- **Available Linguistic Information:** Sentence prompt text.
- **Available Temporal Information:** **None** (no start/end timestamps, duration metadata, or frame counts).

### 3.3. `ISL_CSLRT_Corpus_frame_details.xlsx`
- **Purpose:** Fine-grained catalogue of all continuous sentence-level extracted JPEG frame images.
- **File Structure:** Microsoft Excel OpenXML Workbook (323,296 bytes) containing single sheet `export_dataframe`.
- **Columns:** `Sentence`, `Frames path`
- **Record Counts:** 1 header row + 18,863 data rows (18,864 XML rows total).
- **Relevant Identifiers:** Sentence string in `Sentence`; sequence variant number (`1`..`7`) embedded as subdirectory within `Frames path`.
- **Available Linguistic Information:** Sentence prompt text.
- **Available Temporal Information:** Relative frame ordering encoded via sequential numeric suffixes in file names (e.g., `01.jpg`, `02.jpg`). **No absolute timestamps, framerates, or millisecond offsets.**

### 3.4. `ISL_CSLRT_Corpus_word_details.xlsx`
- **Purpose:** Catalog of isolated word/concept reference sign image frames.
- **File Structure:** Microsoft Excel OpenXML Workbook (126,540 bytes) containing single sheet `export_dataframe`.
- **Columns:** `Word`, `Frames path`
- **Record Counts:** 1 header row + 1,036 populated data rows (18,864 XML row tags allocate empty cells; net populated rows = **1,036**).
- **Relevant Identifiers:** Isolated concept keyword in `Word` (e.g., `"A LOT"`, `"COLLEGE_SCHOOL"`, `"YOU"`).
- **Available Linguistic Information:** Isolated sign vocabulary label.
- **Available Temporal Information:** **None** (static reference images; no temporal sequence or video timestamp).

### 3.5. `ISL_CSLRT.txt`
- **Purpose:** Authoritative corpus overview, institutional provenance, funding acknowledgements, and high-level structural description.
- **File Structure:** Plain UTF-8 text file (1,196 bytes, 3 lines).
- **Key Documented Specifications:**
  - Contributed by 2 native signers from Navajeevan Residential School for the Deaf (Andhra Pradesh) and 5 student volunteers from SASTRA Deemed University (Tamil Nadu).
  - Stated dataset totals: 700 videos, 18,863 sentence-level frames, 1,036 word-level images, 100 spoken language sentences, 7 distinct signers.
  - Funded by Science and Engineering Research Board (SERB), Government of India (Grant SRG/2019/001338).

---

## 4. Entity Relationship Map

The verified architectural connections between metadata entities are mapped below:

```text
+--------------------------------------------------------------------------------+
|                             SPOKEN SENTENCE                                    |
|                      (101 unique in CSV / details.xlsx)                        |
+-----------------------+--------------------------------+-----------------------+
                        |                                |
                        v                                v
       +--------------------------------+   +------------------------------------+
       |         GLOSS SEQUENCE         |   |         VIDEO RECORDING            |
       |  (100 unique sequences in CSV) |   |  (492 valid paths in details.xlsx) |
       +--------------------------------+   |  (687 physical MP4s in archive)    |
                                            +-----------------+------------------+
                                                              |
                                                              v
                                            +------------------------------------+
                                            |       FRAME SEQUENCE (DIR)         |
                                            |   (663 sequences across 97 sents)  |
                                            |      Variants: '1' through '7'     |
                                            +-----------------+------------------+
                                                              |
                                                              v
                                            +------------------------------------+
                                            |      INDIVIDUAL FRAME IMAGES       |
                                            |    (18,863 sequential JPEG files)  |
                                            |       Provides: Frame Ordering     |
                                            +------------------------------------+

       +--------------------------------+   +------------------------------------+
       |          WORD CONCEPT          |   |      ISOLATED REFERENCE IMAGE      |
       |      (114 unique labels)       |-->|   (1,036 word-level JPEG files)    |
       +--------------------------------+   +------------------------------------+
                        |                                |
                        +--------------------------------+
                                        |
                   [RELATIONSHIP NOT ESTABLISHED TO SENTENCES]
                                        |
                                        X (No Sentence FK)
                                        X (No Video FK)
                                        X (No Signer FK)
                                        X (No Temporal Timecodes)
```

### Relational Status:
1. **Sentence → Video Path:** **PARTIALLY VERIFIED** (492 videos indexed across 101 sentences; 195 videos exist in archive without metadata index; 1:1 mapping between specific video files and frame folders is not explicitly declared).
2. **Sentence → Frame Sequence:** **VERIFIED** (18,863 frames across 663 sequences correctly grouped under 97 sentences).
3. **Sentence → Gloss Sequence:** **VERIFIED** (101 sentence-to-gloss mappings in CSV).
4. **Word → Isolated Image:** **VERIFIED** (1,036 image files grouped under 114 word directories).
5. **Word → Sentence Temporal Sequence:** **NOT ESTABLISHED** (Word-level records contain zero keys, pointers, or temporal intervals connecting them to continuous sentence videos or frame sequences).

---

## 5. Continuous Recognition Assessment

| Task Capability | Operational Status | Empirical Justification & Evidence |
| :--- | :--- | :--- |
| **Isolated Sign Recognition** | **PARTIALLY SUPPORTED** | 1,036 word-level static images are available across 114 sign vocabulary classes. However, they are isolated exemplar frames rather than temporal video sequences. |
| **Isolated Word / Concept Recognition** | **SUPPORTED** | 114 distinct lexical concepts exist with multiple photographic variations per word (average ~9.1 frames per word). |
| **Continuous Sentence Recognition** | **SUPPORTED** | 18,863 continuous video frames organized across 663 distinct sentence sequences spanning 97 spoken sentences provide full temporal sequences of continuous signing. |
| **Temporal Localization** | **NOT ESTABLISHED** | The dataset lacks word-level boundary annotations (no start/end frame stamps or bounding boxes) within continuous sentence sequences. Models cannot be supervised to locate where sign tokens begin or end within a continuous sentence. |
| **ISL-to-English Translation** | **PARTIALLY SUPPORTED** | Full-sentence English prompts and full-sequence ISL glosses are provided for 101 sentences. Translation can be evaluated at the sentence level, but vocabulary is constrained to 101 sentences and 170 gloss tokens. |

---

## 6. Signer Identity Assessment

### Documented Context
- `ISL_CSLRT.txt` explicitly documents that recordings were captured from **seven signers**: two native deaf signers from Navajeevan Residential School and five hearing student volunteers from SASTRA University.
- Continuous sentence frame sequences in `Frames_Sentence_Level` are organized into subdirectories named with single digits: **`1`, `2`, `3`, `4`, `5`, `6`, `7`**.

### Structural Breakdown of Variant Slots
- Variant `1`: 96 sentence sequences
- Variant `2`: 96 sentence sequences
- Variant `3`: 96 sentence sequences
- Variant `4`: 90 sentence sequences
- Variant `5`: 96 sentence sequences
- Variant `6`: 96 sentence sequences
- Variant `7`: 93 sentence sequences
- Total: **663 sequences** across 97 sentences.

### Relational Limitation: Identity Mapping Not Established
- **Critical Finding:** The dataset provides **no signer profile table, identity roster, or demographic log**.
- While folder names `1` through `7` correspond to seven recording slots per sentence, the metadata provides no empirical proof that folder `1` for Sentence A was signed by the same individual as folder `1` for Sentence B.
- In video filenames, numeric indicators appear inconsistently (e.g., `free (2).MP4`, `bring water for me (8).MP4`).
- **Conclusion:** Variants `1` through `7` must be treated as **recording variant slots**, NOT certified unique signer IDs, until cross-sequence visual verification or author clarification is obtained.

---

## 7. Frame Sequence Assessment

- **Total Sequences:** **663** distinct sentence-variant sequences.
- **Total Frame Records:** **18,863** frames in `ISL_CSLRT_Corpus_frame_details.xlsx`.
- **Sequence Length Statistics:**
  - Minimum frames per sequence: **6 frames** (`had your food/2`)
  - Maximum frames per sequence: **147 frames** (`my name is xxxxxxxx/3`)
  - Mean frames per sequence: **28.45 frames**
- **Sequential Integrity:**
  - **660 of 663 sequences (99.55%)** exhibit strict consecutive integer numbering without gaps.
  - **3 sequences contain numbering gaps:**
    1. `how are things/3`
    2. `i am really grateful/4`
    3. `i really appreciate it/2`
- **Archive Physical File Verification:** All 18,863 referenced frame paths exist in the official master archive.
- **Temporal Nature:** Frame indices (e.g., `... 01.jpg`, `... 02.jpg`) provide **frame ordering only**. They do not provide physical timestamps, durations, or capture intervals.

---

## 8. Gloss & Word-Level Assessment

### Statistical Breakdown
- **Sentence Records in Gloss Table:** 101 records.
- **Unique Gloss Sequences:** 100 unique sequences (duplicate intent across `"I DONOT AGREE"` and `"I DONT AGREE"`).
- **Total Gloss Token Occurrences:** 362 tokens across the corpus.
- **Unique Gloss Vocabulary:** 170 distinct gloss tokens.
- **Isolated Word Concept Classes:** 114 unique labels in `word_details.xlsx`.
- **Isolated Word Images:** 1,036 images.
- **Direct Lexical Alignment:** Approximately **91 of 170 gloss tokens (~53.5%)** match an isolated word label exactly.

### Lexical & Compound Mismatches
1. **Compound & Disjunctive Labels:** The word dataset merges concepts that appear separated in glosses:
   - Word label `COLLEGE_SCHOOL` ↔ Gloss token `COLLEGE`
   - Word label `HELLO_HI` ↔ Gloss tokens `HELLO` / `HI`
   - Word label `LIKE_LOVE` ↔ Gloss tokens `LIKE` / `LOVE`
   - Word label `I_ME_MINE_MY` ↔ Gloss tokens `I`, `ME`, `MY`
   - Word label `OLD_AGE` ↔ Gloss token `(AGE)`
2. **Orthographic / Typographical Variations:**
   - Gloss `CONGRATULATIIONS` (double 'I') ↔ Word label `CONGRATULATIONS`
   - Gloss `DONOT` ↔ Word label `DO NOT`
3. **Unrepresented Gloss Tokens:** 79 gloss tokens in continuous sentences (e.g., grammatical function tokens such as `A`, `ABOUT`, `AM`, `ANY`, `BE`, `BY`, `CARE`, `CAME`) have no corresponding entry in `word_details.xlsx`.

---

## 9. Dataset Discrepancies

The following discrepancies between documentation, metadata spreadsheets, and archive files have been empirically confirmed:

1. **700 Documented Videos vs. 687 Archive MP4s:**
   - *Documentation:* `ISL_CSLRT.txt` cites 700 videos.
   - *Physical Archive:* Exactly 687 `.mp4` video files exist in `Videos_Sentence_Level/`.
   - *Finding:* Observed discrepancy; cause remains unresolved (13 videos short of theoretical 100 × 7 matrix).
2. **492 Valid Video Records in `details.xlsx` vs. 687 Archive MP4s:**
   - *Metadata:* `details.xlsx` indexes 492 valid video paths (plus 1 trailing cell artifact `>>>\xa0`).
   - *Physical Archive:* 687 MP4s exist in the container.
   - *Finding:* 195 MP4 files physically present in the archive were omitted from `details.xlsx`. Cause remains unresolved.
3. **101 Sentences in Gloss Table vs. 100 Documented Sentences:**
   - *Documentation:* `ISL_CSLRT.txt` states "100 Spoken language Sentences".
   - *Gloss Table:* Contains 101 sentence rows.
   - *Finding:* Two entries represent identical spoken sentences with contraction variation (Row 47: `"i do not agree"` vs Row 50: `"i dont agree"`).
4. **97 Sentences in Frame Details vs. 101 in Details / Glosses:**
   - *Metadata:* `frame_details.xlsx` indexes frames for only 97 unique sentences.
   - *Missing Sentences (4):* `"he would be coming today"`, `"i dont agree"`, `"no need to worry dont worry"`, and `"now onwards he will never hurt you"` have no frame records in `frame_details.xlsx`.
   - *Finding:* Observed discrepancy; cause remains unresolved.
5. **Collegeschool Spacing Variation:**
   - Gloss CSV uses `"which college school are you from"`.
   - Corpus details and frame details use `"which collegeschool are you from"`.
6. **Trailing Metadata Artifact:**
   - Row 493 in `ISL_CSLRT_Corpus details.xlsx` contains the orphan string `['>>>\xa0']`.

---

## 10. Sample Relationship Traces

### Trace 1: `"are you free today"`
- **Spoken Sentence:** `"are you free today"`
- **Gloss Sequence:** `"YOU FREE TODAY"` (VERIFIED in `sign glosses.csv`)
- **Video Path(s):** 5 paths indexed in `details.xlsx` (`free.MP4`, `free (2).MP4` through `free (5).MP4`). (7 MP4s exist in archive). (PARTIAL)
- **Signer / Path Variant:** Variants `1`, `2`, `3`, `4`, `5`, `6`, `7` exist in `frame_details.xlsx`. (PARTIAL)
- **Frame Directory:** `ISL_CSLRT_Corpus\Frames_Sentence_Level\are you free today\` (VERIFIED)
- **Frame Sequence Counts:** 7 sequences (22, 12, 42, 32, 40, 34, 48 frames; Total: 230 frames). (VERIFIED)
- **Word-Level Record:** **NOT ESTABLISHED** (Word images for `FREE` and `YOU` exist in `word_details.xlsx`, but contain no pointer or temporal interval linking them to this sentence).

### Trace 2: `"bring water for me"`
- **Spoken Sentence:** `"bring water for me"`
- **Gloss Sequence:** `"BRING WATER ME"` (VERIFIED)
- **Video Path(s):** 5 paths indexed in `details.xlsx` (`(1).MP4`, `(3).MP4`, `(4).MP4`, `(5).MP4`, `(8).MP4`). (PARTIAL)
- **Signer / Path Variant:** Frame variants `1` through `7` present; video files include non-standard index `(8)`. (PARTIAL)
- **Frame Directory:** `ISL_CSLRT_Corpus\Frames_Sentence_Level\bring water for me\` (VERIFIED)
- **Frame Sequence Counts:** 7 sequences (21, 21, 47, 37, 36, 40, 39 frames; Total: 241 frames). (VERIFIED)
- **Word-Level Record:** **NOT ESTABLISHED**.

### Trace 3: `"what is your phone number"`
- **Spoken Sentence:** `"what is your phone number"`
- **Gloss Sequence:** `"WHAT YOUR PHONE NUMBER"` (VERIFIED)
- **Video Path(s):** 5 paths indexed in `details.xlsx` (`(1).MP4`, `(3).MP4`, `(4).MP4`, `(5).MP4`, `(6).MP4`). (PARTIAL)
- **Signer / Path Variant:** Frame variants `1` through `7` present. (PARTIAL)
- **Frame Directory:** `ISL_CSLRT_Corpus\Frames_Sentence_Level\what is your phone number\` (VERIFIED)
- **Frame Sequence Counts:** 7 sequences (31, 21, 47, 56, 54, 45, 59 frames; Total: 313 frames). (VERIFIED)
- **Word-Level Record:** **NOT ESTABLISHED**.

---

## 11. Data Quality Findings

The following empirical data quality anomalies were identified (no modifications have been made to raw data):
1. **Three frame sequences exhibit index gaps:**
   - `how are things/3`
   - `i am really grateful/4`
   - `i really appreciate it/2`
2. **Inconsistent video file indexing:** Videos under `Videos_Sentence_Level` use arbitrary indices (e.g., `free (2).MP4`, `bring water for me (8).MP4`, `room (4).MP4`), preventing direct algorithmic inference of signer mapping without visual alignment.
3. **Missing relational metadata:** No foreign keys link word images to continuous sentence sequences.
4. **Omission of 195 archive videos from metadata catalog:** 28.4% of archive video files lack metadata records in `details.xlsx`.
5. **Sentence coverage divergence:** 4 sentences are absent from continuous frame extraction metadata.
6. **Lexical and typographical mismatches:** 79 gloss tokens have no direct match in word-level concepts, including misspellings (`CONGRATULATIIONS`) and bundled concepts (`COLLEGE_SCHOOL`).

---

## 12. Production-Relevant Limitations

The ISL-CSLTR dataset presents clear technical boundaries that restrict its utility for production deployment:
1. **No Guaranteed Signer Identity Mapping:** Without verified signer identity labels across sentences, rigorous signer-independent cross-validation (Leave-One-Signer-Out) cannot be guaranteed without manual visual clustering.
2. **Incomplete Video Coverage:** 195 videos are unindexed in official spreadsheets, requiring custom cataloging if used.
3. **No Timestamp-Level Annotations:** The absence of milliseconds or frame-level time boundaries precludes training temporal boundary detection models.
4. **No Word-to-Sentence Temporal Alignment:** Continuous sequences cannot be automatically segmented into isolated word tokens.
5. **Commercial Production Restriction:** The research baseline acquisition governs research exploration only; commercial production rights remain unapproved.
6. **Limited Linguistic Scope:** The corpus covers 101 predetermined prompt sentences and 170 gloss tokens, which is insufficient for general open-vocabulary ISL translation.

---

## 13. Unknowns Requiring Future Verification

The following questions remain open and must be formally resolved in subsequent research phases:
1. **Cross-Sentence Signer Identity:** Do subdirectory numbers `1` through `7` consistently designate the same physical signers across all sentences?
2. **Video-to-Frame Alignment:** What exact deterministic rule maps the 687 MP4 videos to the 663 frame sequence folders?
3. **Reason for 195 Omitted Videos:** Why were 195 archive MP4 files excluded from `ISL_CSLRT_Corpus details.xlsx`?
4. **Reason for 4 Missing Frame Sentences:** Why were 4 sentences excluded from `ISL_CSLRT_Corpus_frame_details.xlsx`?
5. **Subset Provenance:** Do the documentation, video archive, and frame spreadsheets represent different developmental iterations of the corpus?

---

## 14. Implications for Preprocessing

Future preprocessing pipelines (when authorized) must adhere to these empirical constraints:
- **Preserve Variant Grouping:** Grouping by sentence prompt and variant index (`1`..`7`) must be strictly maintained as the primary structural key.
- **Do Not Treat Frame Indices as Timestamps:** Sequential frame numbers indicate relative ordering only. Fixed frame rates cannot be assumed without video container metadata inspection.
- **Maintain Group Isolation for Evaluation:** Splits (train/validation/test) must group at the sentence or variant level to avoid data leakage.
- **Handle Missing Frame Sequences:** Preprocessing loaders must handle the 4 missing frame sentences gracefully without crashing.
- **Strict Data Segregation:** Derived landmark tensors, features, or normalized tokens must reside in distinct derived storage directories, leaving raw files unaltered.

---

## 15. Implications for Model Design

Future model architectures must reflect the realities of the dataset:
- **Continuous Temporal Sequence Modeling is Mandatory:** Continuous sentences cannot be broken down into supervised word chunks due to lack of temporal boundaries. Models must use sequence-to-sequence approaches (e.g., CTC loss, Transformer, or RNN-based architectures).
- **Isolated Word Images Cannot Substitute for Continuous Sequences:** The 1,036 word-level images reflect isolated static gestures and cannot directly supervise continuous dynamic sentence models without explicit domain adaptation.
- **Gloss Token Normalization is Required:** Gloss sequences require programmatic normalization (fixing misspellings like `CONGRATULATIIONS`, resolving contractions like `I DONT AGREE` vs `I DONOT AGREE`) before vocabulary indexing.
- **Conservative Evaluation Metrics:** Due to small sentence vocabulary (101 sentences), models risk memorizing prompt sentences rather than learning generalizable sign language representations.

---

## 16. Audit Conclusion

### Status: RELATIONSHIP AUDIT: PARTIAL

**Justification:**
While sentence-to-frame sequence mappings and sentence-to-gloss mappings are verified and structurally intact, critical relational gaps prevent a full pass:
- Word-level images have no verified relationship or temporal linkage to continuous sentence sequences.
- Video-to-frame mapping is partially verified due to 195 unindexed videos and inconsistent video naming.
- Signer numbers `1`..`7` represent folder slots, but consistent physical cross-sentence identity is not established.
- 4 sentences and 13 theoretical videos are missing from various stages of the metadata.

### Operational State Summary:
- **Dataset acquisition:** Complete and verified against official publisher sources.
- **Raw dataset files:** Unchanged and immutably preserved.
- **Application source code:** Unchanged.
- **Preprocessing:** Not started.
- **Model training:** Not started.

# SignConnect — Offline Python Preprocessing Foundation

## Overview
This directory and associated modules form the offline Python preprocessing foundation for the Indian Sign Language Continuous Sign Language Recognition and Translation (ISL-CSLRT) pipeline.

## Architectural Boundaries & Guarantees
- **Raw Dataset Immutability:** Raw dataset files under `datasets/isl-csltr/` are strictly read-only and immutable. No script or process may alter, move, or overwrite raw metadata or archives.
- **Derived Data Directories:** All outputs, extracted artifacts, splits, and tensor features are isolated to derived directories:
  - `datasets/processed/`
  - `datasets/features/`
  - `datasets/splits/`
  - `datasets/manifests/`
- **230-D Feature Contract v1.0:** The 230-dimensional feature contract (`docs/ISL_CSLRT_PREPROCESSING_ARCHITECTURE.md`) is locked and strictly preserved. Feature extraction has **NOT** started.
- **MediaPipe Pose / Face:** Implementation of MediaPipe Pose and Face landmarkers has **NOT** started in this foundation slice.
- **Model Training:** Model training has **NOT** started.

## Verification
Run the foundation verification script:
```bash
python3 -m scripts.preprocessing.verify_foundation
```

"""SignConnect Preprocessing Configuration.

Milestone 6B-9C-1: Offline Python Preprocessing Foundation.
Strictly defines repository-relative paths, contract versioning, and dimensions.
"""

from pathlib import Path

# Repository Root (evaluated relative to this file location: repo_root/scripts/preprocessing/config.py)
REPO_ROOT: Path = Path(__file__).resolve().parent.parent.parent

# Repository-Relative Data Directory Paths
RAW_DATASET_ROOT: Path = REPO_ROOT / "datasets" / "isl-csltr"
METADATA_ROOT: Path = RAW_DATASET_ROOT / "metadata"
PROCESSED_ROOT: Path = REPO_ROOT / "datasets" / "processed"
FEATURE_ROOT: Path = REPO_ROOT / "datasets" / "features"
SPLIT_ROOT: Path = REPO_ROOT / "datasets" / "splits"
MANIFEST_ROOT: Path = REPO_ROOT / "datasets" / "manifests"

# Expected Dataset & Feature Contract Versioning
DATASET_VERSION: str = "mendeley-isl-csltr-v1.0"
PREPROCESSING_VERSION: str = "prep-v1.0.0"
FEATURE_CONTRACT_VERSION: str = "feat-holistics-d230-v1.0"

# Strict Dimensionality Anchor (Locked Feature Contract v1.0)
EXPECTED_FEATURE_DIM: int = 230

# Expected Metadata Files for Verification
EXPECTED_METADATA_FILES = [
    "ISL Corpus sign glosses.csv",
    "ISL_CSLRT_Corpus details.xlsx",
    "ISL_CSLRT_Corpus_frame_details.xlsx",
    "ISL_CSLRT_Corpus_word_details.xlsx",
    "ISL_CSLRT.txt",
]

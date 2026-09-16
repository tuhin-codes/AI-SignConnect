"""SignConnect — Preprocessing Foundation Verification Command.

Milestone 6B-9C-1: Verification Utility.
Prints preprocessing configuration and verifies the existence of all expected metadata files.
Does NOT process images, extract features, or train models.
"""

import sys
from scripts.preprocessing.config import (
    DATASET_VERSION,
    EXPECTED_FEATURE_DIM,
    EXPECTED_METADATA_FILES,
    FEATURE_CONTRACT_VERSION,
    FEATURE_ROOT,
    MANIFEST_ROOT,
    METADATA_ROOT,
    PREPROCESSING_VERSION,
    PROCESSED_ROOT,
    RAW_DATASET_ROOT,
    REPO_ROOT,
    SPLIT_ROOT,
)


def verify_foundation() -> int:
    """Print configuration and verify directory and metadata integrity."""
    print("=" * 65)
    print("SIGNCONNECT — PREPROCESSING FOUNDATION VERIFICATION")
    print("=" * 65)

    print("\n1. Configuration Parameters:")
    print(f"  Repository Root:          {REPO_ROOT}")
    print(f"  Raw Dataset Root:         {RAW_DATASET_ROOT}")
    print(f"  Metadata Root:            {METADATA_ROOT}")
    print(f"  Processed Root:           {PROCESSED_ROOT}")
    print(f"  Feature Root:             {FEATURE_ROOT}")
    print(f"  Split Root:               {SPLIT_ROOT}")
    print(f"  Manifest Root:            {MANIFEST_ROOT}")
    print(f"  Dataset Version:          {DATASET_VERSION}")
    print(f"  Preprocessing Version:    {PREPROCESSING_VERSION}")
    print(f"  Feature Contract Version: {FEATURE_CONTRACT_VERSION}")
    print(f"  Expected Feature Dim:     {EXPECTED_FEATURE_DIM}")

    print("\n2. Derived Directory Verification:")
    derived_dirs = [
        ("PROCESSED_ROOT", PROCESSED_ROOT),
        ("FEATURE_ROOT", FEATURE_ROOT),
        ("SPLIT_ROOT", SPLIT_ROOT),
        ("MANIFEST_ROOT", MANIFEST_ROOT),
    ]
    all_dirs_ok = True
    for name, path in derived_dirs:
        status = "EXISTS" if path.is_dir() else "MISSING"
        if not path.is_dir():
            all_dirs_ok = False
        print(f"  [{status}] {name}: {path.relative_to(REPO_ROOT)}")

    print("\n3. Metadata File Verification:")
    all_meta_ok = True
    if not METADATA_ROOT.is_dir():
        print(f"  [ERROR] Metadata directory missing: {METADATA_ROOT}")
        all_meta_ok = False
    else:
        for fname in EXPECTED_METADATA_FILES:
            target = METADATA_ROOT / fname
            if target.is_file():
                size_bytes = target.stat().st_size
                print(f"  [FOUND] {fname} ({size_bytes:,} bytes)")
            else:
                print(f"  [MISSING] {fname}")
                all_meta_ok = False

    print("\n4. Status Verification:")
    print("  Feature Extraction: NOT STARTED (Locked at 230-D)")
    print("  Image Processing:   NOT STARTED")
    print("  Model Training:     NOT STARTED")

    if all_dirs_ok and all_meta_ok:
        print("\nRESULT: PREPROCESSING FOUNDATION VERIFIED SUCCESSFULLY")
        print("=" * 65)
        return 0
    else:
        print("\nRESULT: PREPROCESSING FOUNDATION VERIFICATION FAILED")
        print("=" * 65)
        return 1


if __name__ == "__main__":
    sys.exit(verify_foundation())

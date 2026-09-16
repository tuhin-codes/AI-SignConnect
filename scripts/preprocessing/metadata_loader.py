"""SignConnect Metadata Loader.

Python standard-library-only loader and validator for ISL-CSLRT metadata files.
Reads CSV and OpenXML (.xlsx) without external third-party dependencies.
Preserves raw values exactly as Python dataclasses.
Does NOT process images or compute features.
"""

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterator, List, Optional
import xml.etree.ElementTree as ET
import zipfile

from scripts.preprocessing.config import METADATA_ROOT


# OpenXML Namespaces
MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


@dataclass(frozen=True)
class GlossRecord:
    """Record from ISL Corpus sign glosses.csv."""
    sentence: str
    sign_glosses: str


@dataclass(frozen=True)
class VideoRecord:
    """Record from ISL_CSLRT_Corpus details.xlsx."""
    sentence: str
    file_location: str


@dataclass(frozen=True)
class FrameRecord:
    """Record from ISL_CSLRT_Corpus_frame_details.xlsx."""
    sentence: str
    frames_path: str
    sequence_key: str


@dataclass(frozen=True)
class WordRecord:
    """Record from ISL_CSLRT_Corpus_word_details.xlsx."""
    word: str
    frames_path: str


def _check_file_exists(file_path: Path) -> None:
    if not file_path.is_file():
        raise FileNotFoundError(f"Required metadata file not found: {file_path}")


def _derive_sequence_key(frames_path: str) -> str:
    """Derive deterministic sequence key from Windows/POSIX frames path.

    Returns the sequence directory level:
        Frames_Sentence_Level/<sentence>/<slot>
    Example:
        'ISL_CSLRT_Corpus\\Frames_Sentence_Level\\are you free today\\1\\are you free today 01.jpg'
        -> 'Frames_Sentence_Level/are you free today/1'
    """
    normalized = frames_path.replace("\\", "/").strip().rstrip("/")
    parts = normalized.split("/")
    if "Frames_Sentence_Level" in parts:
        idx = parts.index("Frames_Sentence_Level")
        if len(parts) > idx + 2:
            return f"{parts[idx]}/{parts[idx+1]}/{parts[idx+2]}"
    # Fallback to parent directory if prefix differs
    return "/".join(parts[:-1]) if len(parts) > 1 else normalized


def _col_idx_to_letter(col_idx: int) -> str:
    """Convert 1-based column index to Excel column letters (1 -> 'A', 27 -> 'AA')."""
    letters = []
    while col_idx > 0:
        col_idx, remainder = divmod(col_idx - 1, 26)
        letters.append(chr(65 + remainder))
    return "".join(reversed(letters))


def _extract_col_letters(cell_ref: str) -> str:
    """Extract column letters from cell reference (e.g. 'B12' -> 'B')."""
    letters = []
    for char in cell_ref:
        if char.isalpha():
            letters.append(char)
        else:
            break
    return "".join(letters)


def _read_shared_strings(zf: zipfile.ZipFile) -> List[str]:
    """Parse xl/sharedStrings.xml if present."""
    shared_path = "xl/sharedStrings.xml"
    if shared_path not in zf.namelist():
        return []

    strings: List[str] = []
    with zf.open(shared_path) as f:
        tree = ET.parse(f)
        root = tree.getroot()
        for si in root.findall(f"{{{MAIN_NS}}}si"):
            # Text can be in direct <t> or spread across formatted runs <r><t>
            t_elems = si.findall(f".//{{{MAIN_NS}}}t")
            text = "".join(elem.text or "" for elem in t_elems)
            strings.append(text)
    return strings


def _iter_xlsx_rows(xlsx_path: Path) -> Iterator[List[str]]:
    """Iterate over rows of the first sheet in an .xlsx file using standard library."""
    _check_file_exists(xlsx_path)

    with zipfile.ZipFile(xlsx_path, "r") as zf:
        shared_strings = _read_shared_strings(zf)

        # Locate first sheet in xl/worksheets/
        sheet_names = [name for name in zf.namelist() if name.startswith("xl/worksheets/sheet")]
        if not sheet_names:
            raise ValueError(f"No worksheets found in {xlsx_path.name}")
        # Sort to ensure sheet1 is preferred
        sheet_path = sorted(sheet_names)[0]

        with zf.open(sheet_path) as sheet_file:
            # Use iterparse for memory-efficient row streaming
            context = ET.iterparse(sheet_file, events=("end",))
            for event, elem in context:
                if elem.tag == f"{{{MAIN_NS}}}row":
                    row_cells: Dict[str, str] = {}
                    max_col = 0

                    for c in elem.findall(f"{{{MAIN_NS}}}c"):
                        cell_ref = c.get("r", "")
                        cell_type = c.get("t", "")
                        v_elem = c.find(f"{{{MAIN_NS}}}v")
                        val = v_elem.text if v_elem is not None and v_elem.text is not None else ""

                        if cell_type == "s" and val.isdigit():
                            idx = int(val)
                            val = shared_strings[idx] if idx < len(shared_strings) else ""
                        elif cell_type == "inlineStr":
                            is_elem = c.find(f"{{{MAIN_NS}}}is/{{{MAIN_NS}}}t")
                            val = is_elem.text if is_elem is not None and is_elem.text is not None else ""

                        col_letters = _extract_col_letters(cell_ref)
                        if col_letters:
                            row_cells[col_letters] = val

                    if row_cells:
                        # Find highest column letter to construct contiguous row
                        # Determine indices
                        col_indices = {}
                        for ltr in row_cells.keys():
                            idx = 0
                            for char in ltr:
                                idx = idx * 26 + (ord(char.upper()) - 64)
                            col_indices[ltr] = idx
                        max_idx = max(col_indices.values()) if col_indices else 0

                        row_values = []
                        for i in range(1, max_idx + 1):
                            ltr = _col_idx_to_letter(i)
                            row_values.append(row_cells.get(ltr, ""))
                        yield row_values
                    else:
                        yield []

                    elem.clear()


def load_gloss_records() -> List[GlossRecord]:
    """Load and validate records from ISL Corpus sign glosses.csv."""
    path = METADATA_ROOT / "ISL Corpus sign glosses.csv"
    _check_file_exists(path)

    records: List[GlossRecord] = []
    with open(path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = [c.strip() for c in (reader.fieldnames or [])]
        required = ["Sentence", "SIGN GLOSSES"]
        missing = [c for c in required if c not in fieldnames]
        if missing:
            raise ValueError(f"Missing required columns in {path.name}: {missing}")

        for row in reader:
            cleaned_row = {k.strip(): v for k, v in row.items() if k is not None}
            sentence = (cleaned_row.get("Sentence") or "").strip()
            glosses = (cleaned_row.get("SIGN GLOSSES") or "").strip()
            if not sentence:
                continue
            records.append(GlossRecord(sentence=sentence, sign_glosses=glosses))

    if not records:
        raise ValueError(f"No valid records found in {path.name}")
    return records


def load_video_records() -> List[VideoRecord]:
    """Load and validate records from ISL_CSLRT_Corpus details.xlsx."""
    path = METADATA_ROOT / "ISL_CSLRT_Corpus details.xlsx"
    rows = list(_iter_xlsx_rows(path))
    if not rows:
        raise ValueError(f"Empty worksheet in {path.name}")

    header = [c.strip() for c in rows[0]]
    sentence_col_name = "Sentences"
    location_col_name = "File location"

    if sentence_col_name not in header or location_col_name not in header:
        raise ValueError(
            f"Missing required columns in {path.name}. Header found: {header}"
        )

    sent_idx = header.index(sentence_col_name)
    loc_idx = header.index(location_col_name)

    records: List[VideoRecord] = []
    for row in rows[1:]:
        if not row or len(row) <= max(sent_idx, loc_idx):
            continue
        sentence = row[sent_idx].strip()
        location = row[loc_idx].strip()
        if not sentence or not location:
            continue
        records.append(VideoRecord(sentence=sentence, file_location=location))

    if not records:
        raise ValueError(f"No valid records found in {path.name}")
    return records


def load_frame_records() -> List[FrameRecord]:
    """Load and validate records from ISL_CSLRT_Corpus_frame_details.xlsx."""
    path = METADATA_ROOT / "ISL_CSLRT_Corpus_frame_details.xlsx"
    rows = list(_iter_xlsx_rows(path))
    if not rows:
        raise ValueError(f"Empty worksheet in {path.name}")

    header = [c.strip() for c in rows[0]]
    sentence_col_name = "Sentence"
    path_col_name = "Frames path"

    if sentence_col_name not in header or path_col_name not in header:
        raise ValueError(
            f"Missing required columns in {path.name}. Header found: {header}"
        )

    sent_idx = header.index(sentence_col_name)
    path_idx = header.index(path_col_name)

    records: List[FrameRecord] = []
    for row in rows[1:]:
        if not row or len(row) <= max(sent_idx, path_idx):
            continue
        sentence = row[sent_idx].strip()
        frames_path = row[path_idx].strip()
        if not sentence or not frames_path:
            continue
        seq_key = _derive_sequence_key(frames_path)
        records.append(
            FrameRecord(
                sentence=sentence,
                frames_path=frames_path,
                sequence_key=seq_key,
            )
        )

    if not records:
        raise ValueError(f"No valid records found in {path.name}")
    return records


def load_word_records() -> List[WordRecord]:
    """Load and validate records from ISL_CSLRT_Corpus_word_details.xlsx."""
    path = METADATA_ROOT / "ISL_CSLRT_Corpus_word_details.xlsx"
    rows = list(_iter_xlsx_rows(path))
    if not rows:
        raise ValueError(f"Empty worksheet in {path.name}")

    header = [c.strip() for c in rows[0]]
    word_col_name = "Word"
    path_col_name = "Frames path"

    if word_col_name not in header or path_col_name not in header:
        raise ValueError(
            f"Missing required columns in {path.name}. Header found: {header}"
        )

    word_idx = header.index(word_col_name)
    path_idx = header.index(path_col_name)

    records: List[WordRecord] = []
    for row in rows[1:]:
        if not row or len(row) <= max(word_idx, path_idx):
            continue
        word = row[word_idx].strip()
        frames_path = row[path_idx].strip()
        if not word or not frames_path:
            continue
        records.append(WordRecord(word=word, frames_path=frames_path))

    if not records:
        raise ValueError(f"No valid records found in {path.name}")
    return records

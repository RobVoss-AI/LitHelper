"""BibTeX and RIS import/export for collections."""

from typing import Dict, List, Optional, Tuple

import bibtexparser
import rispy
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.paper import Paper
from app.schemas.paper import AuthorShip, PaperSummary


def _paper_to_bibtex_entry(paper: Paper) -> Dict:
    """Convert a Paper model to a bibtex entry dict."""
    authors = []
    if paper.authorships_json:
        for a in paper.authorships_json:
            author = a.get("author", {})
            name = author.get("display_name", "")
            if name:
                authors.append(name)

    # Create a key from first author + year
    first_author = authors[0].split()[-1] if authors else "unknown"
    year = str(paper.publication_year) if paper.publication_year else "0000"
    key = "{}{}".format(first_author.lower(), year)

    entry = {
        "ID": key,
        "ENTRYTYPE": "article",
        "title": paper.title or "",
        "author": " and ".join(authors),
        "year": year,
    }
    if paper.doi:
        # Remove https://doi.org/ prefix if present
        doi = paper.doi
        if doi.startswith("https://doi.org/"):
            doi = doi[len("https://doi.org/"):]
        entry["doi"] = doi
    if paper.openalex_id:
        entry["note"] = "OpenAlex: {}".format(paper.openalex_id)

    return entry


def _paper_to_ris_entry(paper: Paper) -> Dict:
    """Convert a Paper model to a RIS entry dict."""
    entry = {
        "type_of_reference": "JOUR",
        "title": paper.title or "",
        "year": str(paper.publication_year) if paper.publication_year else "",
    }

    authors = []
    if paper.authorships_json:
        for a in paper.authorships_json:
            author = a.get("author", {})
            name = author.get("display_name", "")
            if name:
                authors.append(name)
    if authors:
        entry["authors"] = authors

    if paper.doi:
        doi = paper.doi
        if doi.startswith("https://doi.org/"):
            doi = doi[len("https://doi.org/"):]
        entry["doi"] = doi

    loc = paper.primary_location_json or {}
    source = loc.get("source") or {}
    if source.get("display_name"):
        entry["journal_name"] = source["display_name"]

    return entry


async def export_bibtex(paper_ids: List[str], db: AsyncSession) -> str:
    """Export papers as BibTeX string."""
    entries = []
    for pid in paper_ids:
        paper = await db.get(Paper, pid)
        if paper:
            entries.append(_paper_to_bibtex_entry(paper))

    bib_db = bibtexparser.bibdatabase.BibDatabase()
    bib_db.entries = entries
    writer = bibtexparser.bwriter.BibTexWriter()
    return writer.write(bib_db)


async def export_ris(paper_ids: List[str], db: AsyncSession) -> str:
    """Export papers as RIS string."""
    entries = []
    for pid in paper_ids:
        paper = await db.get(Paper, pid)
        if paper:
            entries.append(_paper_to_ris_entry(paper))

    return rispy.dumps(entries)


def parse_bibtex(content: str) -> List[Dict]:
    """Parse BibTeX content and extract DOIs/titles for resolution."""
    parser = bibtexparser.bparser.BibTexParser(common_strings=True)
    bib_db = bibtexparser.parse(content) if hasattr(bibtexparser, 'parse') else bibtexparser.loads(content, parser)

    results = []
    entries = bib_db.entries if hasattr(bib_db, 'entries') else []
    for entry in entries:
        doi = entry.get("doi", "")
        title = entry.get("title", "")
        year = entry.get("year", "")
        results.append({
            "doi": doi,
            "title": title,
            "year": year,
            "key": entry.get("ID", ""),
        })
    return results


def parse_ris(content: str) -> List[Dict]:
    """Parse RIS content and extract DOIs/titles for resolution."""
    try:
        entries = rispy.loads(content)
    except Exception:
        return []

    results = []
    for entry in entries:
        doi = entry.get("doi", "")
        title = entry.get("title", "") or entry.get("primary_title", "")
        year = entry.get("year", "") or entry.get("publication_year", "")
        results.append({
            "doi": doi,
            "title": title,
            "year": year,
        })
    return results

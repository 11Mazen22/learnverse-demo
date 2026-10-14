# Original-package preservation references

Generated for this repository on 2026-10-15 with python-docx, openpyxl and python-pptx. Entirely synthetic, no real account or student data.

- `word-reference.docx`: headings, mixed bold/normal runs, Arabic, embedded PNG, table, header and footer.
- `workbook-reference.xlsx`: formatted values, SUM formula, a second sheet with cross-sheet formula, chart, frozen pane and filter.
- `slides-reference.pptx`: three editable slides, embedded PNGs, theme/layout relationships and speaker notes.

The regression opens these ordinary DEFLATE archives, edits one text target, then independently verifies all ZIP CRCs, XML parsing, resource bytes and byte-identical compressed records outside the changed part. This does not certify arbitrary Office extensions, pagination, text overflow, recalculation in Excel or visual equality in every Office viewer. Mixed styles within an edited paragraph inherit its first run style as disclosed in the UI.

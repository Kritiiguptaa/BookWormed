import json
import re

infile = 'final_book_data_fixed.json'
outfile_books = 'final_book_data_fixed.json'
outfile_genres = '..\\client\\public\\genres.json'

seen = set()

def parse_genres_field(g):
    if not g:
        return []
    if isinstance(g, list):
        return [str(x).strip() for x in g if x]
    s = str(g).strip()

    # Try JSON style with single quotes
    if s.startswith('[') and s.endswith(']'):
        try:
            js = s.replace("'", '"')
            arr = json.loads(js)
            return [str(x).strip() for x in arr if x]
        except:
            # fallback regex
            items = re.findall(r"'([^']+)'", s)
            if items:
                return [it.strip() for it in items]

    # last fallback: split by comma
    parts = [p.strip() for p in re.split(r',|;', s) if p.strip()]
    return parts

all_genres = []
fixed_books = []

with open(infile, 'r', encoding='utf-8') as f:
    data = json.load(f)

for row in data:
    g = row.get('Genres') or row.get('genres')
    items = parse_genres_field(g)

    # save cleaned genres back into book object
    row['Genres'] = items  
    fixed_books.append(row)

    # also build global genre list
    for it in items:
        it_clean = ' '.join(it.split())
        if it_clean and it_clean.lower() not in seen:
            seen.add(it_clean.lower())
            all_genres.append(it_clean)

# sort genres
all_genres.sort(key=lambda x: x.lower())

# write global genre dropdown file
genres_output = [{'value': g.lower(), 'label': g} for g in all_genres]

with open(outfile_genres, 'w', encoding='utf-8') as f:
    json.dump(genres_output, f, ensure_ascii=False, indent=2)

# write FIXED book data
with open(outfile_books, 'w', encoding='utf-8') as f:
    json.dump(fixed_books, f, ensure_ascii=False, indent=2)

print("Done!")
print(f"- Fixed books saved to {outfile_books}")
print(f"- Genres saved to {outfile_genres}")

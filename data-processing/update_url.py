import pandas as pd
import os

# --- Same file names as your main script ---
original_clean_file = 'updated_goodreads_data.xlsx'
raw_file = 'goodreads_data.xlsx'
output_json_filename = 'final_book_data.json'
output_excel_filename = 'final_book_data.xlsx'
client_public_path = os.path.join('..', 'client', 'public')
client_books_file = os.path.join(client_public_path, 'books_full.json')


# --- Helper: Create Amazon Search URL ---
def make_amazon_url(title, author):
    if pd.isna(title):
        return None
    t = str(title).replace(" ", "+")
    a = str(author).replace(" ", "+")
    return f"https://www.amazon.in/s?k={t}+{a}"


print("📘 Starting URL update script...")

# --- Load data from the same file your image script uses ---
if os.path.exists(output_excel_filename):
    print(f"Loading: {output_excel_filename}")
    df = pd.read_excel(output_excel_filename)

elif os.path.exists(original_clean_file):
    print(f"Loading: {original_clean_file}")
    df = pd.read_excel(original_clean_file)

else:
    print(f"Loading raw file: {raw_file}")
    df = pd.read_excel(raw_file)


# --- Add Amazon_URL column ---
print("🛒 Adding Amazon URLs...")

if 'Amazon_URL' not in df.columns:
    df['Amazon_URL'] = df.apply(
        lambda row: make_amazon_url(row['Book'], row['Author']),
        axis=1
    )
else:
    df['Amazon_URL'] = df.apply(
        lambda row: make_amazon_url(row['Book'], row['Author']) 
        if pd.isna(row['Amazon_URL']) or row['Amazon_URL'] == "" 
        else row['Amazon_URL'],
        axis=1
    )

# --- Replace existing URL column with Amazon_URL (user requested) ---
if 'Amazon_URL' in df.columns:
    # Overwrite/replace the generic URL column with Amazon_URL values
    df['URL'] = df['Amazon_URL']
    print('🔁 Replaced `URL` column with `Amazon_URL` values')

# --- Create client/public/books_full.json for client-side searching and images ---
print('📦 Preparing client public dataset...')
try:
    os.makedirs(client_public_path, exist_ok=True)
    # Select and reorder useful columns for the client
    columns_for_client = []
    for c in ['Book', 'Author', 'Description', 'Genres', 'Avg_Rating', 'Num_Ratings', 'Image_URL', 'URL', 'Amazon_URL']:
        if c in df.columns:
            columns_for_client.append(c)

    client_df = df[columns_for_client].copy()

    # Ensure Genres is serializable (if stored as string, keep as-is)
    client_df.to_json(client_books_file, orient='records', force_ascii=False, indent=2)
    print(f'✅ Wrote client dataset to: {client_books_file}')
except Exception as e:
    print('⚠️ Failed to write client dataset:', e)


# --- Save updated files ---
print("💾 Saving updated files...")

df.to_excel(output_excel_filename, index=False)
df.to_json(output_json_filename, orient='records', indent=4)

print("\n🎉 Done! Amazon URLs added successfully.")

import pandas as pd
import io
import requests
import time
import os
import itertools
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO

# --- 1. SETUP ---
load_dotenv()  # Load the .env file

# Load one or multiple API keys
keys = os.getenv("GOOGLE_BOOKS_KEYS", "").split(",")
keys = [k.strip() for k in keys if k.strip()]
if not keys:
    print("❌ ERROR: No Google Books API keys found in .env file.")
    exit()

key_cycle = itertools.cycle(keys)

original_clean_file = 'updated_goodreads_data.xlsx'
raw_file = 'goodreads_data.xlsx'
output_json_filename = 'final_book_data_fixed.json'
output_excel_filename = 'final_book_data.xlsx'


# --- 2. HELPER FUNCTIONS ---
def is_valid_image(url):
    """Check if the image is valid (not a placeholder, not too small)."""
    try:
        r = requests.get(url, timeout=10)
        if r.status_code != 200 or not r.headers.get("content-type", "").startswith("image"):
            return False
        
        img = Image.open(BytesIO(r.content))
        
        # --- NEW, BETTER CHECK ---
        # Convert to grayscale to check brightness (Luminance)
        img_gray = img.convert('L')
        # getextrema() returns (min, max) brightness
        extrema_gray = img_gray.getextrema() 
        
        # If the darkest pixel in the image is still very bright 
        # (e.g., > 150 on a 0-255 scale), it's a placeholder.
        if extrema_gray[0] > 150:
            return False
        # --- END NEW CHECK ---

        w, h = img.size
        if w < 100 or h < 150:  # too small to be useful
            return False
            
        return True
        
    except Exception:
        return False
# def is_valid_image(url):
#     """Check if the image is valid (not white, not too small)."""
#     try:
#         r = requests.get(url, timeout=10)
#         if r.status_code != 200 or not r.headers.get("content-type", "").startswith("image"):
#             return False
#         img = Image.open(BytesIO(r.content))
#         extrema = img.getextrema()
#         if all(v[0] > 230 for v in extrema):  # mostly white
#             return False
#         w, h = img.size
#         if w < 100 or h < 150:  # too small to be useful
#             return False
#         return True
#     except Exception:
#         return False


def get_best_image(book_id):
    """Try different zoom levels to find the clearest valid image."""
    base_url = "https://books.google.com/books/content?id={}&printsec=frontcover&img=1&zoom={}&source=gbs_api"
    for zoom in range(6, 0, -1):  # try highest to lowest
        url = base_url.format(book_id, zoom)
        if is_valid_image(url):
            return url
    return None


def get_image_url(book_title):
    """Fetch book cover image from Google Books API, safely handling rate limits."""
    for attempt in range(len(keys)):  # Try each key once
        api_key = next(key_cycle)
        url = "https://www.googleapis.com/books/v1/volumes"
        params = {'q': f'intitle:{book_title}', 'key': api_key, 'maxResults': 1}

        try:
            response = requests.get(url, params=params, timeout=10)

            # Handle rate limit
            if response.status_code == 429:
                print(f"⚠️ Key {attempt+1}/{len(keys)} hit rate limit. Trying next key...")
                time.sleep(10)
                continue  # Try the next key

            response.raise_for_status()
            data = response.json()

            if 'items' in data and len(data['items']) > 0:
                volume = data['items'][0]
                volume_info = volume.get('volumeInfo', {})

                # Try to get the clearest version
                book_id = volume.get('id')
                if book_id:
                    best_img = get_best_image(book_id)
                    if best_img:
                        return best_img

                # fallback: thumbnail if zoom versions fail
                if 'imageLinks' in volume_info and 'thumbnail' in volume_info['imageLinks']:
                    return volume_info['imageLinks']['thumbnail']

            return None

        except requests.exceptions.RequestException as e:
            print(f"  Error fetching '{book_title}' with key {attempt+1}: {e}")
            time.sleep(5)
            continue  # Try next key

    # If all keys failed due to rate limit -> wait and retry
    print("😴 All keys rate-limited. Waiting 5 minutes before retrying...")
    time.sleep(900) # Wait 15 (900 sec) for a test
    return get_image_url(book_title)  # Try again after cooldown


# --- 3. MAIN SCRIPT ---
try:
    print(f"✅ Loaded {len(keys)} API key(s).")

    # --- Step 1: Load Data ---
    if os.path.exists(output_excel_filename):
        print(f"Loading existing progress file: '{output_excel_filename}'")
        df = pd.read_excel(output_excel_filename)
    elif os.path.exists(original_clean_file):
        print(f"Loading cleaned file: '{original_clean_file}'")
        df = pd.read_excel(original_clean_file)
        df['Image_URL'] = None
    else:
        print(f"No clean file found. Loading and cleaning '{raw_file}'...")
        df = pd.read_excel(raw_file)
        df['Description'] = df['Description'].fillna('null')
        df = df.drop_duplicates(subset=['Book'], keep='first')
        df['Image_URL'] = None
        df = df.reset_index(drop=True)

    # --- ADD AMAZON SEARCH URL COLUMN ---
    # def make_amazon_url(title, author):
    #     if pd.isna(title):
    #         return None
    #     t = str(title).replace(" ", "+")
    #     a = str(author).replace(" ", "+")
    #     return f"https://www.amazon.in/s?k={t}+{a}"

    # # Create column if missing
    # if 'Amazon_URL' not in df.columns:
    #     df['Amazon_URL'] = df.apply(lambda row: make_amazon_url(row['Book'], row['Author']), axis=1)

    # # Fill missing Amazon URLs (if any)
    # df['Amazon_URL'] = df.apply(
    #     lambda row: make_amazon_url(row['Book'], row['Author']) if pd.isna(row['Amazon_URL']) else row['Amazon_URL'],
    #     axis=1
    # )

    # --- Step 2: Filter Unprocessed Rows ---
    
    # === MODIFIED THIS LINE ===
    to_process = df[df['Image_URL'].isnull()]
    # ==========================
    
    if len(to_process) == 0:
        print("✅ All books already processed. Exiting.")
        exit()

    print(f"--- 2. Resuming Image Fetch  ---")
    print(f"Total books to process: {len(to_process)}")

    # --- Step 3: Loop and Fetch Images ---
    for count, index in enumerate(to_process.index, start=1):
        title = df.at[index, 'Book']
        print(f"Processing book {count}/{len(to_process)}: {title}")

        url = get_image_url(title)

        if url:
            df.at[index, 'Image_URL'] = url
            print("  ✅ Found clear image URL.")
        else:
            df.at[index, 'Image_URL'] = 'NOT_FOUND'
            print("  ⚠️ URL not found.")

        # Delay to prevent hitting per-second limits
        time.sleep(2.5)

        # Save progress every 50 books (won't be hit in this test)
        if count % 50 == 0:
            print(f"\n--- 💾 Saving progress after {count} books ---\n")
            df.to_excel(output_excel_filename, index=False)

    # --- Step 4: Final Save ---
    print("\nImage fetching complete for test run. Final save...")
    df.to_excel(output_excel_filename, index=False)
    df.to_json(output_json_filename, orient='records', indent=4)

    print("\n🎉 Test run complete!")

except FileNotFoundError:
    print(f"❌ ERROR: File not found. Ensure '{raw_file}' or '{original_clean_file}' exists.")
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    




# import pandas as pd
# import io
# import requests
# import time
# import os
# import itertools
# from dotenv import load_dotenv
# from PIL import Image
# from io import BytesIO

# # --- 1. SETUP ---
# load_dotenv()  # Load the .env file

# # Load one or multiple API keys
# keys = os.getenv("GOOGLE_BOOKS_KEYS", "").split(",")
# keys = [k.strip() for k in keys if k.strip()]
# if not keys:
#     print("❌ ERROR: No Google Books API keys found in .env file.")
#     exit()

# key_cycle = itertools.cycle(keys)

# original_clean_file = 'updated_goodreads_data.xlsx'
# raw_file = 'goodreads_data.xlsx'
# output_json_filename = 'final_book_data.json'
# output_excel_filename = 'final_book_data.xlsx'


# # --- 2. HELPER FUNCTIONS ---
# def is_valid_image(url):
#     """Check if the image is valid (not white, not too small)."""
#     try:
#         r = requests.get(url, timeout=10)
#         if r.status_code != 200 or not r.headers.get("content-type", "").startswith("image"):
#             return False
#         img = Image.open(BytesIO(r.content))
#         extrema = img.getextrema()
#         if all(v[0] > 230 for v in extrema):  # mostly white
#             return False
#         w, h = img.size
#         if w < 100 or h < 150:  # too small to be useful
#             return False
#         return True
#     except Exception:
#         return False


# def get_best_image(book_id):
#     """Try different zoom levels to find the clearest valid image."""
#     base_url = "https://books.google.com/books/content?id={}&printsec=frontcover&img=1&zoom={}&source=gbs_api"
#     for zoom in range(6, 0, -1):  # try highest to lowest
#         url = base_url.format(book_id, zoom)
#         if is_valid_image(url):
#             return url
#     return None


# def get_image_url(book_title):
#     """Fetch book cover image from Google Books API, safely handling rate limits."""
#     for attempt in range(len(keys)):  # Try each key once
#         api_key = next(key_cycle)
#         url = "https://www.googleapis.com/books/v1/volumes"
#         params = {'q': f'intitle:{book_title}', 'key': api_key, 'maxResults': 1}

#         try:
#             response = requests.get(url, params=params, timeout=10)

#             # Handle rate limit
#             if response.status_code == 429:
#                 print(f"⚠️ Key {attempt+1}/{len(keys)} hit rate limit. Trying next key...")
#                 time.sleep(10)
#                 continue  # Try the next key

#             response.raise_for_status()
#             data = response.json()

#             if 'items' in data and len(data['items']) > 0:
#                 volume = data['items'][0]
#                 volume_info = volume.get('volumeInfo', {})

#                 # Try to get the clearest version
#                 book_id = volume.get('id')
#                 if book_id:
#                     best_img = get_best_image(book_id)
#                     if best_img:
#                         return best_img

#                 # fallback: thumbnail if zoom versions fail
#                 if 'imageLinks' in volume_info and 'thumbnail' in volume_info['imageLinks']:
#                     return volume_info['imageLinks']['thumbnail']

#             return None

#         except requests.exceptions.RequestException as e:
#             print(f"  Error fetching '{book_title}' with key {attempt+1}: {e}")
#             time.sleep(5)
#             continue  # Try next key

#     # If all keys failed due to rate limit → wait and retry
#     print("😴 All keys rate-limited. Waiting 5 minutes before retrying...")
#     time.sleep(900)
#     return get_image_url(book_title)  # Try again after cooldown


# # --- 3. MAIN SCRIPT ---
# try:
#     print(f"✅ Loaded {len(keys)} API key(s).")

#     # --- Step 1: Load Data ---
#     if os.path.exists(output_excel_filename):
#         print(f"Loading existing progress file: '{output_excel_filename}'")
#         df = pd.read_excel(output_excel_filename)
#     elif os.path.exists(original_clean_file):
#         print(f"Loading cleaned file: '{original_clean_file}'")
#         df = pd.read_excel(original_clean_file)
#         df['Image_URL'] = None
#     else:
#         print(f"No clean file found. Loading and cleaning '{raw_file}'...")
#         df = pd.read_excel(raw_file)
#         df['Description'] = df['Description'].fillna('null')
#         df = df.drop_duplicates(subset=['Book'], keep='first')
#         df['Image_URL'] = None
#         df = df.reset_index(drop=True)

#     # --- Step 2: Filter Unprocessed Rows ---
#     to_process = df[df['Image_URL'].isnull()]
#     if len(to_process) == 0:
#         print("✅ All books already processed. Exiting.")
#         exit()

#     print(f"--- 2. Resuming Image Fetch ---")
#     print(f"Total books to process: {len(to_process)}")

#     # --- Step 3: Loop and Fetch Images ---
#     for count, index in enumerate(to_process.index, start=1):
#         title = df.at[index, 'Book']
#         print(f"Processing book {count}/{len(to_process)}: {title}")

#         url = get_image_url(title)

#         if url:
#             df.at[index, 'Image_URL'] = url
#             print("  ✅ Found clear image URL.")
#         else:
#             df.at[index, 'Image_URL'] = 'NOT_FOUND'
#             print("  ⚠️ URL not found.")

#         # Delay to prevent hitting per-second limits
#         time.sleep(2.5)

#         # Save progress every 50 books
#         if count % 50 == 0:
#             print(f"\n--- 💾 Saving progress after {count} books ---\n")
#             df.to_excel(output_excel_filename, index=False)

#     # --- Step 4: Final Save ---
#     print("\nImage fetching complete. Final save...")
#     df.to_excel(output_excel_filename, index=False)
#     df.to_json(output_json_filename, orient='records', indent=4)

#     print("\n🎉 All steps complete successfully!")

# except FileNotFoundError:
#     print(f"❌ ERROR: File not found. Ensure '{raw_file}' or '{original_clean_file}' exists.")
# except Exception as e:
#     print(f"❌ Unexpected error: {e}")










# import pandas as pd
# import io
# import requests
# import time
# import os
# import itertools
# from dotenv import load_dotenv

# # --- 1. SETUP ---
# load_dotenv()  # Load the .env file

# # Load one or multiple API keys
# keys = os.getenv("GOOGLE_BOOKS_KEYS", "").split(",")
# keys = [k.strip() for k in keys if k.strip()]
# if not keys:
#     print("❌ ERROR: No Google Books API keys found in .env file.")
#     exit()

# key_cycle = itertools.cycle(keys)

# original_clean_file = 'updated_goodreads_data.xlsx'
# raw_file = 'goodreads_data.xlsx'
# output_json_filename = 'final_book_data.json'
# output_excel_filename = 'final_book_data.xlsx'


# # --- 2. HELPER FUNCTION ---
# def get_image_url(book_title):
#     """Fetch book cover image from Google Books API, safely handling rate limits."""
#     for attempt in range(len(keys)):  # Try each key once
#         api_key = next(key_cycle)
#         url = "https://www.googleapis.com/books/v1/volumes"
#         params = {'q': f'intitle:{book_title}', 'key': api_key, 'maxResults': 1}

#         try:
#             response = requests.get(url, params=params, timeout=10)

#             # Handle rate limit
#             if response.status_code == 429:
#                 print(f"⚠️ Key {attempt+1}/{len(keys)} hit rate limit. Trying next key...")
#                 time.sleep(10)
#                 continue  # Try the next key

#             response.raise_for_status()
#             data = response.json()

#             if 'items' in data and len(data['items']) > 0:
#                 volume_info = data['items'][0].get('volumeInfo', {})
#                 # if 'imageLinks' in volume_info and 'thumbnail' in volume_info['imageLinks']:
#                 #     return volume_info['imageLinks']['thumbnail']
#                 if 'imageLinks' in volume_info and 'thumbnail' in volume_info['imageLinks']:
#                     img_url = volume_info['imageLinks']['thumbnail']
#                     # Replace 'zoom=1' with 'zoom=3' for higher resolution
#                     img_url = img_url.replace('zoom=1', 'zoom=3')
#                     return img_url

#             return None

#         except requests.exceptions.RequestException as e:
#             print(f"  Error fetching '{book_title}' with key {attempt+1}: {e}")
#             time.sleep(5)
#             continue  # Try next key

#     # If all keys failed due to rate limit → wait and retry
#     print("😴 All keys rate-limited. Waiting 5 minutes before retrying...")
#     time.sleep(900)
#     return get_image_url(book_title)  # Try again after cooldown


# # --- 3. MAIN SCRIPT ---
# try:
#     print(f"✅ Loaded {len(keys)} API key(s).")

#     # --- Step 1: Load Data ---
#     if os.path.exists(output_excel_filename):
#         print(f"Loading existing progress file: '{output_excel_filename}'")
#         df = pd.read_excel(output_excel_filename)
#     elif os.path.exists(original_clean_file):
#         print(f"Loading cleaned file: '{original_clean_file}'")
#         df = pd.read_excel(original_clean_file)
#         df['Image_URL'] = None
#     else:
#         print(f"No clean file found. Loading and cleaning '{raw_file}'...")
#         df = pd.read_excel(raw_file)
#         df['Description'] = df['Description'].fillna('null')
#         df = df.drop_duplicates(subset=['Book'], keep='first')
#         df['Image_URL'] = None
#         df = df.reset_index(drop=True)

#     # --- Step 2: Filter Unprocessed Rows ---
#     to_process = df[df['Image_URL'].isnull()]
#     if len(to_process) == 0:
#         print("✅ All books already processed. Exiting.")
#         exit()

#     print(f"--- 2. Resuming Image Fetch ---")
#     print(f"Total books to process: {len(to_process)}")

#     # --- Step 3: Loop and Fetch Images ---
#     for count, index in enumerate(to_process.index, start=1):
#         title = df.at[index, 'Book']
#         print(f"Processing book {count}/{len(to_process)}: {title}")

#         url = get_image_url(title)

#         if url:
#             df.at[index, 'Image_URL'] = url
#             print("  ✅ Found URL.")
#         else:
#             df.at[index, 'Image_URL'] = 'NOT_FOUND'
#             print("  ⚠️ URL not found.")

#         # Delay to prevent hitting per-second limits
#         time.sleep(2.5)

#         # Save progress every 50 books
#         if count % 50 == 0:
#             print(f"\n--- 💾 Saving progress after {count} books ---\n")
#             df.to_excel(output_excel_filename, index=False)

#     # --- Step 4: Final Save ---
#     print("\nImage fetching complete. Final save...")
#     df.to_excel(output_excel_filename, index=False)
#     df.to_json(output_json_filename, orient='records', indent=4)

#     print("\n🎉 All steps complete successfully!")

# except FileNotFoundError:
#     print(f"❌ ERROR: File not found. Ensure '{raw_file}' or '{original_clean_file}' exists.")
# except Exception as e:
#     print(f"❌ Unexpected error: {e}")


# import pandas as pd
# import io
# import requests
# import time
# import os

# # --- 1. SETUP ---
# # Original file from first script
# original_clean_file = 'updated_goodreads_data.xlsx' 
# # Original raw file
# raw_file = 'goodreads_data.xlsx'

# # Final output files
# output_json_filename = 'final_book_data.json'
# output_excel_filename = 'final_book_data.xlsx'


# # --- 2. HELPER FUNCTION (for Open Library API) ---
# def get_image_url(book_title):
#     """Fetches the book cover image URL from the Open Library API."""
    
#     # Base URL for the API
#     url = "https://openlibrary.org/search.json"
    
#     # Query parameters (search by title)
#     params = {
#         'title': book_title
#     }
    
#     try:
#         response = requests.get(url, params=params, timeout=10)
#         response.raise_for_status() # Raise an error for bad responses
        
#         data = response.json()
        
#         # Check if any books ('docs') were found
#         if 'docs' in data and len(data['docs']) > 0:
#             book_doc = data['docs'][0] # Get the top result
            
#             # Check if the book has a cover ID
#             if 'cover_i' in book_doc:
#                 cover_id = book_doc['cover_i']
#                 # Build the image URL. '-L' requests a Large image.
#                 return f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"
                
#         # If no book or no cover_i is found
#         return None
        
#     except requests.exceptions.RequestException as e:
#         print(f"  Error fetching '{book_title}': {e}")
#         return None

# # --- 3. MAIN SCRIPT ---
# try:
#     df = None
    
#     # --- Step 1: Load Data ---
#     if os.path.exists(output_excel_filename):
#         # A. Load the partially-completed file if it exists
#         print(f"Loading existing progress file: '{output_excel_filename}'")
#         df = pd.read_excel(output_excel_filename)
#     elif os.path.exists(original_clean_file):
#         # B. Load the cleaned file from your last script
#         print(f"Loading cleaned file: '{original_clean_file}'")
#         df = pd.read_excel(original_clean_file)
#         df['Image_URL'] = None # Add the empty column
#     else:
#         # C. Re-run cleaning if no files are found
#         print(f"No clean file found. Loading and cleaning '{raw_file}'...")
#         df = pd.read_excel(raw_file)
#         df['Description'] = df['Description'].fillna('null')
#         df = df.drop_duplicates(subset=['Book'], keep='first')
#         df['Image_URL'] = None # Add the empty column
#         df = df.reset_index(drop=True) 

#     # --- Step 2: Find Rows That Need Processing ---
#     # Get all rows where Image_URL is Null OR marked 'NOT_FOUND' 
#     # (in case you want to retry the ones Google couldn't find)
#     to_process = df[df['Image_URL'].isnull() | (df['Image_URL'] == 'NOT_FOUND')]
    
#     if len(to_process) == 0:
#         print("✅ All books already processed. Exiting.")
#         exit()
        
#     print(f"--- 2. Resuming Image Fetch ---")
#     print(f"Total books to process: {len(to_process)}")

#     # --- Step 3: Loop and Fetch Images ---
#     # We loop using .index to safely modify the original df
#     for index in to_process.index:
#         title = df.at[index, 'Book']
        
#         # Calculate overall progress
#         total_processed = len(df) - len(to_process) + (to_process.index.get_loc(index) + 1)
        
#         print(f"Processing book at index {index} ({total_processed}/{len(df)}): {title}")
        
#         url = get_image_url(title)
        
#         if url:
#             df.at[index, 'Image_URL'] = url
#             print("  ✅ Found URL.")
#         else:
#             # Mark as 'NOT_FOUND' so we don't try again next time
#             df.at[index, 'Image_URL'] = 'NOT_FOUND' 
#             print("  ⚠️ URL not found.")
            
#         # --- NEW SLEEP TIME: 0.5 seconds ---
#         time.sleep(0.5) 
        
#         # --- Save progress every 50 books ---
#         if (total_processed % 50) == 0:
#             print(f"\n--- 💾 Saving progress to file... ---\n")
#             df.to_excel(output_excel_filename, index=False)

#     # --- Step 4: Final Save ---
#     print("\nImage fetching complete. Final save...")
#     df.to_excel(output_excel_filename, index=False)
#     df.to_json(output_json_filename, orient='records', indent=4)

#     print("\n--- All steps complete ---")

# except FileNotFoundError:
#     print(f"❌ ERROR: File not found. Make sure '{raw_file}' or '{original_clean_file}' is present.")
# except Exception as e:
#     print(f"An unexpected error occurred: {e}")

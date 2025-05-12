import csv
import os

# Path to the original PSU CSV file
input_file = 'psu.csv'
# Path for the temporary output file
output_file = 'psu_filtered.csv'

# Read the original file and filter out PSUs with wattage under 750W
with open(input_file, 'r', encoding='utf-8') as infile, open(output_file, 'w', encoding='utf-8', newline='') as outfile:
    # Create CSV reader and writer
    reader = csv.reader(infile)
    writer = csv.writer(outfile)
    
    # Read the header row
    header = next(reader)
    # Write the header to the output file
    writer.writerow(header)
    
    # Find the index of the Wattage column
    wattage_index = header.index('Wattage') if 'Wattage' in header else 1  # Default to column 1 if not found
    
    # Process each row
    for row in reader:
        if len(row) > wattage_index:
            # Extract the wattage value
            wattage_str = row[wattage_index].strip()
            
            # Extract numerical value from string like "750W"
            wattage = 0
            try:
                # Remove non-numeric characters and convert to integer
                wattage = int(''.join(filter(str.isdigit, wattage_str)))
            except:
                # Skip if wattage can't be parsed
                continue
            
            # Only include PSUs with 750W or higher
            if wattage >= 750:
                writer.writerow(row)

# Replace the original file with the filtered one
os.replace(output_file, input_file)

print(f"PSU list has been filtered to include only 750W or higher power supplies.")
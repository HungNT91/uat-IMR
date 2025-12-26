import openpyxl
import json

# Load Excel file
workbook = openpyxl.load_workbook('data.xlsx')
sheet = workbook.active

# Get headers
headers = [cell.value for cell in sheet[1]]
print("Columns found:", headers)

# Get first few rows
print("\nFirst 3 rows:")
for row in sheet.iter_rows(min_row=2, max_row=4, values_only=True):
    print(dict(zip(headers, row)))

workbook.close()

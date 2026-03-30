import json

# Load the merged data
data = json.load(open('public/test.data'))

print(f'Total products: {len(data)}')
print('Last 3 products:')
for i, p in enumerate(data[-3:]):
    print(f'{len(data)-2+i}: {p["name"]} - Price: {p["price"]}')

# Verify the new products are there
expected_last_prices = [3.09, 2.45, 3.35]  # Last 3 prices from file 7
actual_last_prices = [p['price'] for p in data[-3:]]
print(f'\nLast 3 prices match: {actual_last_prices == expected_last_prices}')
print(f'Expected: {expected_last_prices}')
print(f'Actual: {actual_last_prices}')

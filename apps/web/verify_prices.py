import json

# Load the data
data = json.load(open('7'))

print('First 5 products:')
for i, p in enumerate(data[:5]):
    print(f'{i+1}: {p["name"]} - Price: {p["price"]}')

print()
print('Last 5 products:')
for i, p in enumerate(data[-5:]):
    print(f'{len(data)-4+i}: {p["name"]} - Price: {p["price"]}')

# Verify all prices
expected = [2.85, 1.49, 2.59, 2.85, 2.19, 6.50, 3.19, 5.99, 1.75, 2.49, 5.85, 1.35, 2.85, 3.25, 1.65, 1.89, 5.69, 1.29, 2.69, 5.99, 2.79, 2.40, 3.69, 2.25, 2.55, 2.55, 0.95, 2.45, 2.99, 5.55, 1.45, 1.45, 1.99, 3.19, 2.21, 3.56, 2.55, 5.95, 2.79, 2.45, 3.09, 3.35]

prices = [p['price'] for p in data]
print(f'\nTotal products: {len(prices)}')
print(f'Expected prices: {len(expected)}')
print(f'All prices match: {prices == expected}')

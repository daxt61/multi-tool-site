import re

tools_raw = """
invoice-generator
margin-calculator
vat-calculator
roi-calculator
budget-planner
expense-tracker
loan-calculator
savings-calculator
salary-calculator
tip-calculator
currency-converter
calculator
percentage
bmi-calculator
date-calculator
unit-converter
color-converter
number-converter
word-counter
case-converter
text-formatter
lorem-ipsum
markdown-preview
markdown-table
diff-checker
morse-code
list-cleaner
password-generator
jwt-decoder
qr-code
uuid-generator
base64
hash-generator
json-csv
json-formatter
json-to-ts
sql-formatter
yaml-json
cron-generator
html-entity
unix-timestamp
url-encoder
image-to-base64
timer
image-compressor
ip-address
aspect-ratio
bpm-counter
random-generator
"""

tools = [t.strip() for t in tools_raw.split('\n') if t.strip()]

sitemap = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://multitools-five.vercel.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://multitools-five.vercel.app/a-propos</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://multitools-five.vercel.app/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://multitools-five.vercel.app/confidentialite</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
"""

for tool in tools:
    sitemap += f"""  <url>
    <loc>https://multitools-five.vercel.app/outil/{tool}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
"""

sitemap += "</urlset>"

with open("public/sitemap.xml", "w") as f:
    f.write(sitemap)

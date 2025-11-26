#!/bin/bash
curl -X POST http://localhost:3000/api/ai-agent/scrape-product \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.bol.com/nl/nl/p/lego-botanicals-hibiscus-10372/9300000227400233/"}'
